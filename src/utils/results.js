import copyBank from '../data/copyBank.json';
import { getSide, getLevel, getTopAxes, getDiffLevel } from './scoring';

/**
 * Pick empathy line for top axis
 * @param {Object} scores - { EI, SN, TF, JP }
 * @returns {Object} - { axis, text }
 */
export function pickEmpathyLine(scores) {
    const topAxes = getTopAxes(scores);
    const top = topAxes[0];

    const side = top.side;
    const level = top.level;

    const text = copyBank.empathy[top.axis]?.[side]?.[level] ||
        copyBank.empathy[top.axis]?.[side]?.['mid'];

    return {
        axis: top.axis,
        side,
        level,
        text,
    };
}

/**
 * Build objective bullet points
 * @param {Object} scores - { EI, SN, TF, JP }
 * @param {Object} workScores - optional
 * @param {Object} privateScores - optional
 * @returns {Array} - [{ text }, ...]
 */
export function buildObjectiveBullets(scores, workScores = null, privateScores = null) {
    const bullets = [];
    const axes = ['EI', 'SN', 'TF', 'JP'];

    // Sort by distance from 50
    const sorted = axes
        .map(axis => ({ axis, score: scores[axis], distance: Math.abs(scores[axis] - 50) }))
        .sort((a, b) => b.distance - a.distance);

    // Top 2 strongest
    sorted.slice(0, 2).forEach(({ axis, score }) => {
        const level = getLevel(score);
        const levelText = level === 'high' ? '높음' : level === 'mid' ? '중간' : '낮음';
        const axisName = copyBank.axisNames[axis].name;
        bullets.push({
            text: `${axisName} 축이 ${score}점(${levelText})입니다`,
            type: 'strength',
        });
    });

    // Most neutral
    const mostNeutral = sorted[sorted.length - 1];
    bullets.push({
        text: `${copyBank.axisNames[mostNeutral.axis].name} 축은 ${mostNeutral.score}점으로 상황 영향이 큽니다`,
        type: 'neutral',
    });

    // Mode diff if available
    if (workScores && privateScores) {
        const maxDiff = axes
            .map(axis => ({
                axis,
                diff: workScores[axis] - privateScores[axis],
                absDiff: Math.abs(workScores[axis] - privateScores[axis]),
            }))
            .sort((a, b) => b.absDiff - a.absDiff)[0];

        if (maxDiff.absDiff >= 10) {
            const axisName = copyBank.axisNames[maxDiff.axis].name;
            const sign = maxDiff.diff > 0 ? '+' : '';
            bullets.push({
                text: `업무 모드에서 ${axisName}이 사적보다 ${sign}${maxDiff.diff}p 차이납니다`,
                type: 'diff',
            });
        }
    }

    return bullets;
}

/**
 * Pick action cards for work and private
 * @param {Object} scores - { EI, SN, TF, JP }
 * @returns {Object} - { work: { axis, text }, private: { axis, text } }
 */
export function pickActionCards(scores) {
    const topAxes = getTopAxes(scores);

    // Pick work action from top axis
    const workTop = topAxes[0];
    const workSide = workTop.side;
    const workLevel = workTop.level === 'low' ? 'mid' : workTop.level;
    const workText = copyBank.actionCards.work[workTop.axis]?.[workSide]?.[workLevel] ||
        copyBank.actionCards.work[workTop.axis]?.[workSide]?.['mid'];

    // Pick private action from second top or different axis
    const privateTop = topAxes.length > 1 ? topAxes[1] : topAxes[0];
    const privateSide = privateTop.side;
    const privateLevel = privateTop.level === 'low' ? 'mid' : privateTop.level;
    const privateText = copyBank.actionCards.private[privateTop.axis]?.[privateSide]?.[privateLevel] ||
        copyBank.actionCards.private[privateTop.axis]?.[privateSide]?.['mid'];

    return {
        work: {
            axis: workTop.axis,
            side: workSide,
            text: workText,
            title: '💼 업무에서 이렇게 해보세요',
        },
        private: {
            axis: privateTop.axis,
            side: privateSide,
            text: privateText,
            title: '🏠 사적 관계에서 이렇게 해보세요',
        },
    };
}

/**
 * Get mode diff interpretation
 * @param {Array} diffs - from calculateDiff
 * @returns {Array} - [{ axis, text, level }, ...]
 */
export function getModeDiffInterpretation(diffs) {
    return diffs.slice(0, 3).map(({ axis, diff, absDiff, direction }) => {
        const level = getDiffLevel(absDiff);
        const text = copyBank.modeDiff[axis]?.[direction] || '';

        return {
            axis,
            diff,
            absDiff,
            direction,
            level,
            text,
            axisName: copyBank.axisNames[axis].name,
        };
    });
}

/**
 * Get code description
 * @param {string} code - e.g., "ESTJ"
 * @returns {string} - e.g., "표현형/현실형/기준형/구조형"
 */
export function getCodeDescription(code) {
    return code.split('').map(c => copyBank.codeDescriptions[c]).join(' / ');
}
