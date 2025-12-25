import questions from '../data/questions.json';

/**
 * Calculate axis scores from answers
 * @param {Object} answers - { questionId: score (1-7) }
 * @returns {Object} - { EI, SN, TF, JP } each 0-100
 */
export function calculateScores(answers) {
  const axes = { EI: [], SN: [], TF: [], JP: [] };

  questions.forEach((q) => {
    if (answers[q.id] !== undefined) {
      let score = answers[q.id];
      // Reverse scoring: 8 - score
      if (q.reverse) {
        score = 8 - score;
      }
      axes[q.axis].push(score);
    }
  });

  const result = {};
  Object.keys(axes).forEach((axis) => {
    if (axes[axis].length > 0) {
      const sum = axes[axis].reduce((a, b) => a + b, 0);
      // Normalize: raw (6-42) -> 0-100
      const min = axes[axis].length; // 1 * n
      const max = axes[axis].length * 7; // 7 * n
      const normalized = Math.round(((sum - min) / (max - min)) * 100);
      result[axis] = Math.max(0, Math.min(100, normalized));
    } else {
      result[axis] = 50; // default to middle
    }
  });

  return result;
}

/**
 * Get personality code from scores
 * @param {Object} scores - { EI, SN, TF, JP }
 * @returns {string} - e.g., "ESTJ"
 */
export function getCode(scores) {
  return [
    scores.EI >= 50 ? 'E' : 'I',
    scores.SN >= 50 ? 'S' : 'N',
    scores.TF >= 50 ? 'T' : 'F',
    scores.JP >= 50 ? 'J' : 'P',
  ].join('');
}

/**
 * Get strength level for a score
 * @param {number} score - 0-100
 * @returns {string} - 'high', 'mid', 'low'
 */
export function getLevel(score) {
  const distance = Math.abs(score - 50);
  if (distance >= 20) return 'high';
  if (distance >= 8) return 'mid';
  return 'low';
}

/**
 * Get side for an axis score
 * @param {string} axis - 'EI', 'SN', 'TF', 'JP'
 * @param {number} score - 0-100
 * @returns {string} - first or second letter
 */
export function getSide(axis, score) {
  const sides = {
    EI: ['I', 'E'],
    SN: ['N', 'S'],
    TF: ['F', 'T'],
    JP: ['P', 'J'],
  };
  return score >= 50 ? sides[axis][1] : sides[axis][0];
}

/**
 * Get top 3 axes by strength (distance from 50)
 * @param {Object} scores - { EI, SN, TF, JP }
 * @returns {Array} - [{ axis, score, side, level }, ...]
 */
export function getTopAxes(scores) {
  return Object.entries(scores)
    .map(([axis, score]) => ({
      axis,
      score,
      side: getSide(axis, score),
      level: getLevel(score),
      distance: Math.abs(score - 50),
    }))
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 3);
}

/**
 * Calculate diff between work and private scores
 * @param {Object} workScores
 * @param {Object} privateScores
 * @returns {Array} - [{ axis, diff, absDiff, direction }, ...]
 */
export function calculateDiff(workScores, privateScores) {
  const axes = ['EI', 'SN', 'TF', 'JP'];
  return axes
    .map((axis) => {
      const diff = workScores[axis] - privateScores[axis];
      return {
        axis,
        diff,
        absDiff: Math.abs(diff),
        direction: diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral',
      };
    })
    .sort((a, b) => b.absDiff - a.absDiff);
}

/**
 * Get diff level description
 * @param {number} absDiff
 * @returns {string}
 */
export function getDiffLevel(absDiff) {
  if (absDiff >= 18) return '크게 다름';
  if (absDiff >= 10) return '꽤 다름';
  return '비슷함';
}

/**
 * Encode scores to a compact string for URL sharing
 * @param {Object} data - { scores, workScores?, privateScores?, targetType, targetName }
 * @returns {string}
 */
export function encodeResults(data) {
  const { scores, workScores, privateScores, targetType, targetName } = data;

  const s = [scores.EI, scores.SN, scores.TF, scores.JP].join(',');
  const ws = workScores ? [workScores.EI, workScores.SN, workScores.TF, workScores.JP].join(',') : '';
  const ps = privateScores ? [privateScores.EI, privateScores.SN, privateScores.TF, privateScores.JP].join(',') : '';

  const compact = `v2|${s}|${ws}|${ps}|${targetType || 'self'}|${targetName || ''}`;

  // Use btoa with unicode support trick
  return btoa(unescape(encodeURIComponent(compact)));
}

/**
 * Decode results from compact string or old JSON format
 * @param {string} encoded
 * @returns {Object|null}
 */
export function decodeResults(encoded) {
  try {
    const decoded = decodeURIComponent(escape(atob(encoded)));

    if (decoded.startsWith('v2|')) {
      const parts = decoded.split('|');
      const s = parts[1].split(',').map(Number);
      const ws = parts[2] ? parts[2].split(',').map(Number) : null;
      const ps = parts[3] ? parts[3].split(',').map(Number) : null;

      const scores = { EI: s[0], SN: s[1], TF: s[2], JP: s[3] };
      const workScores = ws && ws.length === 4 ? { EI: ws[0], SN: ws[1], TF: ws[2], JP: ws[3] } : null;
      const privateScores = ps && ps.length === 4 ? { EI: ps[0], SN: ps[1], TF: ps[2], JP: ps[3] } : null;

      return {
        scores,
        code: getCode(scores),
        hasDualProfile: !!workScores,
        workScores,
        workCode: workScores ? getCode(workScores) : null,
        privateScores,
        privateCode: privateScores ? getCode(privateScores) : null,
        targetType: parts[4],
        targetName: parts[5] || null
      };
    }

    // Fallback to old dynamic JSON format
    return JSON.parse(decoded);
  } catch (e) {
    try {
      // Absolute fallback for non-URI encoded b64
      return JSON.parse(atob(encoded));
    } catch (ee) {
      return null;
    }
  }
}

/**
 * Save results to localStorage
 * @param {Object} data
 */
export function saveResults(data) {
  localStorage.setItem('modePersonalityResults', JSON.stringify(data));
}

/**
 * Load results from localStorage
 * @returns {Object|null}
 */
export function loadResults() {
  try {
    const data = localStorage.getItem('modePersonalityResults');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}
