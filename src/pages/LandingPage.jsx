import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadResults } from '../utils/scoring';
import '../styles/landing.css';

export default function LandingPage() {
    const navigate = useNavigate();
    const [hasResults, setHasResults] = useState(false);
    const [showTargetSelect, setShowTargetSelect] = useState(false);
    const [targetName, setTargetName] = useState('');

    useEffect(() => {
        const saved = loadResults();
        setHasResults(!!saved);
    }, []);

    const handleStartSelf = () => {
        sessionStorage.setItem('testTarget', JSON.stringify({ type: 'self', name: null }));
        navigate('/test');
    };

    const handleStartOther = () => {
        if (!targetName.trim()) return;
        sessionStorage.setItem('testTarget', JSON.stringify({ type: 'other', name: targetName.trim() }));
        navigate('/test');
    };

    return (
        <div className="landing">
            <div className="landing-bg"></div>
            <div className="landing-content">
                <header className="landing-header">
                    <span className="badge">모드 성향 테스트</span>
                    <h1>
                        <span className="highlight">사적 나</span> vs{' '}
                        <span className="highlight">업무 나</span>
                        <br />
                        얼마나 다른지 3분이면 나옵니다
                    </h1>
                    <p className="subtitle">
                        결과는 <strong>'공감 1문장 + 객관 3포인트 + 관계 스크립트 2개'</strong>로 바로 제공
                    </p>
                </header>

                {!showTargetSelect ? (
                    <div className="landing-cta">
                        <button className="btn-primary" onClick={() => setShowTargetSelect(true)}>
                            테스트 시작하기
                            <span className="btn-arrow">→</span>
                        </button>

                        {hasResults && (
                            <button className="btn-secondary" onClick={() => navigate('/result')}>
                                이전 결과 다시보기
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="target-select">
                        <h2>누구를 테스트할까요?</h2>

                        <button className="target-btn self" onClick={handleStartSelf}>
                            <span className="target-icon">🙋</span>
                            <span className="target-label">나 자신</span>
                            <span className="target-desc">내 성향을 알아봐요</span>
                        </button>

                        <div className="target-divider">
                            <span>또는</span>
                        </div>

                        <div className="target-other">
                            <button className="target-btn other" onClick={() => document.getElementById('targetNameInput').focus()}>
                                <span className="target-icon">👤</span>
                                <span className="target-label">상대방</span>
                                <span className="target-desc">내가 보는 그 사람의 성향</span>
                            </button>

                            <div className="target-input-wrap">
                                <input
                                    id="targetNameInput"
                                    type="text"
                                    placeholder="상대방 이름/별명"
                                    value={targetName}
                                    onChange={(e) => setTargetName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleStartOther()}
                                    maxLength={10}
                                />
                                <button
                                    className="btn-primary btn-sm"
                                    onClick={handleStartOther}
                                    disabled={!targetName.trim()}
                                >
                                    시작 →
                                </button>
                            </div>
                        </div>

                        <button className="btn-text" onClick={() => setShowTargetSelect(false)}>
                            ← 돌아가기
                        </button>
                    </div>
                )}

                <footer className="landing-footer">
                    <p className="disclaimer">
                        ⚠️ 본 테스트는 MBTI® 공식 검사가 아니며, 성향을 참고하기 위한 도구입니다.
                        <br />
                        진단/치료 목적이 아닙니다.
                    </p>
                </footer>
            </div>
        </div>
    );
}
