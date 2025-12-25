import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadResults, decodeResults, calculateDiff, getSide, getLevel } from '../utils/scoring';
import {
    pickEmpathyLine,
    buildObjectiveBullets,
    pickActionCards,
    getModeDiffInterpretation,
    getCodeDescription
} from '../utils/results';
import copyBank from '../data/copyBank.json';
import '../styles/result.css';

export default function ResultPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState(null);
    const cardRef = useRef(null);

    useEffect(() => {
        const encoded = searchParams.get('r');
        if (encoded) {
            const decoded = decodeResults(encoded);
            if (decoded) {
                setResults(decoded);
                return;
            }
        }
        const saved = loadResults();
        if (saved) {
            setResults(saved);
        } else {
            navigate('/');
        }
    }, [searchParams, navigate]);

    if (!results) {
        return (
            <div className="result-page loading">
                <div className="loader"></div>
            </div>
        );
    }

    const { scores, code, hasDualProfile, privateScores, privateCode, workScores, workCode, targetType, targetName } = results;

    const isOther = targetType === 'other';
    const displayName = targetName || '상대방';
    const subjectText = isOther ? `${displayName}님은` : '당신은';

    // Get type profile
    const typeProfile = copyBank.typeProfiles[code] || {};

    // Get axis descriptions
    const getAxisInfo = (axis) => {
        const side = getSide(axis, scores[axis]);
        return copyBank.axisDescriptions[axis]?.[side] || {};
    };

    // Generate result content
    const empathy = pickEmpathyLine(scores);
    const bullets = buildObjectiveBullets(scores, hasDualProfile ? workScores : null, hasDualProfile ? privateScores : null);
    const actionCards = pickActionCards(scores);

    let modeDiffs = [];
    if (hasDualProfile) {
        const diffs = calculateDiff(workScores, privateScores);
        modeDiffs = getModeDiffInterpretation(diffs);
    }

    return (
        <div className="result-page">
            <header className="result-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    ← 처음으로
                </button>
            </header>

            <div className="result-content" ref={cardRef}>
                {/* Hero Section */}
                <section className="result-section hero-section">
                    <div className="hero-top">
                        <span className="section-badge">
                            {isOther ? `👤 ${displayName}의 모드 성향` : '나의 모드 성향'}
                        </span>
                        <h1 className="main-code">{code}</h1>
                        <p className="type-title">{typeProfile.title}</p>
                    </div>

                    <p className="type-subtitle">{typeProfile.subtitle}</p>

                    {/* Keywords Table */}
                    {typeProfile.keywords && (
                        <div className="keywords-grid">
                            {typeProfile.keywords.map((keyword, i) => (
                                <span key={i} className="keyword-tag">{keyword}</span>
                            ))}
                        </div>
                    )}

                    <p className="section-note">
                        💡 기본 테스트 24문항의 결과입니다. 상황 구분 없이 평소 성향을 반영합니다.
                    </p>
                </section>

                {/* Type Description */}
                <section className="result-section description-section">
                    <h2>📖 {isOther ? `${displayName}님은` : '나는'} 어떤 사람인가?</h2>
                    <p className="description-text">{typeProfile.description}</p>

                    {typeProfile.strengths && (
                        <div className="trait-block strengths">
                            <h3>💪 강점</h3>
                            <p>{typeProfile.strengths}</p>
                        </div>
                    )}

                    {typeProfile.challenges && (
                        <div className="trait-block challenges">
                            <h3>⚡ 주의할 점</h3>
                            <p>{typeProfile.challenges}</p>
                        </div>
                    )}
                </section>

                {/* Dual Profile */}
                {hasDualProfile && (
                    <section className="result-section dual-section">
                        <div className="section-header">
                            <h2>🎭 모드별 상세 분석</h2>
                            <span className="section-badge-inline">사적 나 vs 업무 나</span>
                        </div>

                        <p className="section-note private">
                            💡 사적 모드는 친구, 가족, 연인과 함께할 때를, 업무 모드는 회사/보고 등 일할 때를 상상하며 답한 결과입니다.
                        </p>

                        <div className="dual-analysis">
                            {/* Private Mode Column */}
                            <div className="analysis-col private">
                                <div className="col-header">
                                    <span className="mode-icon">🏠</span>
                                    <h3>사적 모드</h3>
                                    <span className="mode-meaning">"편안한 관계에서의 나"</span>
                                </div>
                                <div className="analysis-card">
                                    <div className="card-top">
                                        <span className="analysis-code">{privateCode}</span>
                                        <p className="analysis-title">{copyBank.typeProfiles[privateCode]?.title}</p>
                                    </div>
                                    <p className="analysis-desc">{copyBank.typeProfiles[privateCode]?.description}</p>
                                    <div className="analysis-traits">
                                        <div className="trait-item">
                                            <strong>💪 강점:</strong> {copyBank.typeProfiles[privateCode]?.strengths}
                                        </div>
                                        <div className="trait-item">
                                            <strong>⚡ 주의:</strong> {copyBank.typeProfiles[privateCode]?.challenges}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Work Mode Column */}
                            <div className="analysis-col work">
                                <div className="col-header">
                                    <span className="mode-icon">💼</span>
                                    <h3>업무 모드</h3>
                                    <span className="mode-meaning">"생산적인 환경에서의 나"</span>
                                </div>
                                <div className="analysis-card">
                                    <div className="card-top">
                                        <span className="analysis-code">{workCode}</span>
                                        <p className="analysis-title">{copyBank.typeProfiles[workCode]?.title}</p>
                                    </div>
                                    <p className="analysis-desc">{copyBank.typeProfiles[workCode]?.description}</p>
                                    <div className="analysis-traits">
                                        <div className="trait-item">
                                            <strong>💪 강점:</strong> {copyBank.typeProfiles[workCode]?.strengths}
                                        </div>
                                        <div className="trait-item">
                                            <strong>⚡ 주의:</strong> {copyBank.typeProfiles[workCode]?.challenges}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {privateCode !== workCode ? (
                            <div className="mode-insight special">
                                <span className="insight-icon">✨</span>
                                <p>
                                    {isOther ? `${displayName}님은` : '당신은'} <strong>상황에 따라 페르소나를 전환하는 타입</strong>이에요!
                                    <br />업무와 사생활에서의 에너지 사용 방식이 달라 효율적인 조절 능력을 가지고 있습니다.
                                </p>
                            </div>
                        ) : (
                            <div className="mode-insight">
                                <span className="insight-icon">🎯</span>
                                <p>
                                    {isOther ? `${displayName}님은` : '당신은'} <strong>어떤 상황에서도 일관된 모습을 유지하는 타입</strong>이에요!
                                    <br />내면의 가치와 행동 양식이 견고하여 어디서나 신뢰받는 일관성을 보여줍니다.
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {/* Axis Bars */}
                <section className="result-section">
                    <h2>📊 축별 점수</h2>
                    <div className="axis-bars">
                        {Object.entries(copyBank.axisNames).map(([axis, info]) => (
                            <div key={axis} className="axis-bar-item">
                                <div className="axis-labels">
                                    <span>{info.left}</span>
                                    <span className="axis-name">{info.name}</span>
                                    <span>{info.right}</span>
                                </div>
                                <div className="axis-bar">
                                    <div className="axis-marker" style={{ left: `${scores[axis]}%` }}>
                                        <span className="axis-value">{scores[axis]}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Axis Detailed Descriptions */}
                <section className="result-section axis-details-section">
                    <h2>🔍 선호 지표별 분석</h2>
                    {['EI', 'SN', 'TF', 'JP'].map(axis => {
                        const axisInfo = getAxisInfo(axis);
                        const score = scores[axis];
                        const level = getLevel(score);
                        const levelText = level === 'high' ? '선호 강함' : level === 'mid' ? '중간 범위' : '경향 있음';

                        return (
                            <div key={axis} className="axis-detail-item">
                                <div className="axis-detail-header">
                                    <span className="axis-detail-title">{axisInfo.title}</span>
                                    <span className="axis-detail-level">{levelText}</span>
                                </div>
                                <p className="axis-detail-text">{axisInfo.description}</p>
                            </div>
                        );
                    })}
                </section>

                {/* Mode Diff */}
                {hasDualProfile && modeDiffs.length > 0 && (
                    <section className="result-section">
                        <h2>🔄 모드 차이 분석</h2>
                        <div className="diff-list">
                            {modeDiffs.map((diff, i) => (
                                <div key={i} className="diff-item">
                                    <div className="diff-header">
                                        <span className="diff-axis">{diff.axisName}</span>
                                        <span className={`diff-badge ${diff.diff > 0 ? 'positive' : 'negative'}`}>
                                            {diff.diff > 0 ? '+' : ''}{diff.diff}p
                                        </span>
                                        <span className="diff-level">{diff.level}</span>
                                    </div>
                                    <p className="diff-text">{diff.text}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Perceived Image - Work */}
                {hasDualProfile && workCode && (
                    <section className="result-section perceived-section">
                        <h2>💼 업무에서 {isOther ? `${displayName}님이` : '내가'} 보이는 모습</h2>
                        <div className="perceived-card work">
                            <p>{copyBank.perceivedImage?.work?.[workCode] || '업무 상황에서의 인상입니다.'}</p>
                        </div>
                    </section>
                )}

                {/* Perceived Image - Private */}
                {hasDualProfile && privateCode && (
                    <section className="result-section perceived-section">
                        <h2>🏠 사적 관계에서 {isOther ? `${displayName}님이` : '내가'} 보이는 모습</h2>
                        <div className="perceived-card private">
                            <p>{copyBank.perceivedImage?.private?.[privateCode] || '사적 관계에서의 인상입니다.'}</p>
                        </div>
                    </section>
                )}

                {/* Consistency Analysis */}
                {hasDualProfile && (() => {
                    const totalDiff = modeDiffs.reduce((sum, d) => sum + Math.abs(d.diff), 0);
                    const avgDiff = totalDiff / modeDiffs.length;

                    let consistency;
                    if (avgDiff < 10) {
                        consistency = copyBank.consistencyAnalysis?.consistent;
                    } else if (avgDiff < 18) {
                        consistency = copyBank.consistencyAnalysis?.moderate;
                    } else {
                        consistency = copyBank.consistencyAnalysis?.different;
                    }

                    if (!consistency) return null;

                    return (
                        <section className="result-section consistency-section">
                            <h2>{consistency.title}</h2>
                            <p className="consistency-desc">{consistency.description}</p>
                            <ul className="consistency-tips">
                                {consistency.tips?.map((tip, i) => (
                                    <li key={i}>{tip}</li>
                                ))}
                            </ul>
                        </section>
                    );
                })()}

                {/* Action Cards */}
                <section className="result-section">
                    <h2>💡 실천 가이드</h2>
                    <div className="action-cards">
                        <div className="action-card work">
                            <h3>{actionCards.work.title}</h3>
                            <p>{actionCards.work.text}</p>
                        </div>
                        <div className="action-card private">
                            <h3>{actionCards.private.title}</h3>
                            <p>{actionCards.private.text}</p>
                        </div>
                    </div>
                </section>

                {/* Disclaimer */}
                <footer className="result-footer">
                    <p>
                        ⚠️ 본 테스트는 MBTI® 공식 검사가 아니며, 성향을 참고하기 위한 도구입니다.
                    </p>
                </footer>
            </div>

            {/* Share Buttons */}
            <div className="share-buttons">
                <button className="btn-primary" onClick={() => navigate('/share')}>
                    결과 공유하기 ✨
                </button>
                <button className="btn-secondary" onClick={() => navigate('/test')}>
                    다시 테스트하기
                </button>
            </div>
        </div>
    );
}
