import questions from '../data/questions.json' with { type: 'json' };

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
 * Encode scores to an ultra-compact string for URL sharing (v3)
 * @param {Object} data - { scores, workScores?, privateScores?, targetType, targetName }
 * @returns {string}
 */
export function encodeResults(data) {
  const { scores, workScores, privateScores, targetType, targetName } = data;

  // v3: use dot delimiters and short identifiers to minimize B64 size
  // order: EI,SN,TF,JP
  const s = `${scores.EI}.${scores.SN}.${scores.TF}.${scores.JP}`;
  const ws = workScores ? `${workScores.EI}.${workScores.SN}.${workScores.TF}.${workScores.JP}` : '';
  const ps = privateScores ? `${privateScores.EI}.${privateScores.SN}.${privateScores.TF}.${privateScores.JP}` : '';
  const type = targetType === 'other' ? 'o' : 's';
  const name = targetName ? encodeURIComponent(targetName) : '';

  const compact = `v3|${s}|${ws}|${ps}|${type}|${name}`;
  return btoa(unescape(encodeURIComponent(compact))).replace(/=/g, ''); // Remove padding for shorter URL
}

/**
 * Decode results from v3, v2, or v1 format
 * @param {string} encoded
 * @returns {Object|null}
 */
export function decodeResults(encoded) {
  if (!encoded) return null;

  try {
    // Legacy links might be URL-encoded (containing %7B etc.)
    const rawB64 = decodeURIComponent(encoded);

    // Add back padding if needed for atob
    let b64 = rawB64;
    while (b64.length % 4 !== 0) b64 += '=';

    let decoded;
    try {
      // Handle potential Unicode in b64
      const binary = atob(b64);
      try {
        decoded = decodeURIComponent(escape(binary));
      } catch (e) {
        decoded = binary;
      }
    } catch (e) {
      return null;
    }

    // Recursively decode URI components if still present (v1 legacy style)
    let safetyCounter = 0;
    while (decoded.includes('%') && safetyCounter < 3) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
        safetyCounter++;
      } catch (e) {
        break;
      }
    }

    // Check v3
    if (decoded.startsWith('v3|')) {
      const parts = decoded.split('|');
      const [, sStr, wsStr, psStr, type, name] = parts;

      const s = sStr.split('.').map(Number);
      const scores = { EI: s[0], SN: s[1], TF: s[2], JP: s[3] };

      let workScores = null;
      if (wsStr && wsStr.length > 0) {
        const ws = wsStr.split('.').map(Number);
        workScores = { EI: ws[0], SN: ws[1], TF: ws[2], JP: ws[3] };
      }

      let privateScores = null;
      if (psStr && psStr.length > 0) {
        const ps = psStr.split('.').map(Number);
        privateScores = { EI: ps[0], SN: ps[1], TF: ps[2], JP: ps[3] };
      }

      return {
        scores,
        code: getCode(scores),
        hasDualProfile: !!workScores,
        workScores,
        workCode: workScores ? getCode(workScores) : null,
        privateScores,
        privateCode: privateScores ? getCode(privateScores) : null,
        targetType: type === 'o' ? 'other' : 'self',
        targetName: name ? decodeURIComponent(name) : null
      };
    }

    // Check v2
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

    // v1 Fallback (JSON)
    const data = JSON.parse(decoded);
    // Ensure scores exists or re-calculate if somehow missing
    if (data && !data.scores && data.workScores && data.privateScores) {
      // Recover scores from average of work/private if missing
      data.scores = {
        EI: Math.round((data.workScores.EI + data.privateScores.EI) / 2),
        SN: Math.round((data.workScores.SN + data.privateScores.SN) / 2),
        TF: Math.round((data.workScores.TF + data.privateScores.TF) / 2),
        JP: Math.round((data.workScores.JP + data.privateScores.JP) / 2),
      };
      data.code = getCode(data.scores);
    }
    return data;
  } catch (e) {
    try {
      // Radical fallback
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
