import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import questions from '../data/questions.json';
import modeQuestionIds from '../data/modeQuestions.json';
import { calculateScores, getCode, saveResults } from '../utils/scoring';
import '../styles/test.css';

// Fisher-Yates shuffle
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default function TestPage() {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [phase, setPhase] = useState('base'); // 'base', 'modeSelect', 'private', 'work'
    const [privateAnswers, setPrivateAnswers] = useState({});
    const [workAnswers, setWorkAnswers] = useState({});

    // Get test target (self or other)
    const testTarget = useMemo(() => {
        try {
            const saved = sessionStorage.getItem('testTarget');
            return saved ? JSON.parse(saved) : { type: 'self', name: null };
        } catch {
            return { type: 'self', name: null };
        }
    }, []);

    const isOther = testTarget.type === 'other';
    const targetName = testTarget.name || '상대방';

    // Randomize question order once per test session
    const shuffledQuestions = useMemo(() => shuffleArray(questions), []);
    const shuffledModeQuestions = useMemo(() => {
        return shuffleArray(questions.filter(q => modeQuestionIds.includes(q.id)));
    }, []);

    // Get current question set based on phase
    const getQuestions = () => {
        if (phase === 'base') return shuffledQuestions;
        return shuffledModeQuestions;
    };

    const currentQuestions = getQuestions();
    const currentQuestion = currentQuestions[currentIndex];

    const totalSteps = phase === 'base' ? shuffledQuestions.length : shuffledModeQuestions.length;
    const progress = ((currentIndex + 1) / totalSteps) * 100;

    const handleAnswer = (score) => {
        const newAnswers = { ...getCurrentAnswers(), [currentQuestion.id]: score };
        setCurrentAnswers(newAnswers);

        if (currentIndex < currentQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            handlePhaseComplete(newAnswers);
        }
    };

    const getCurrentAnswers = () => {
        switch (phase) {
            case 'private': return privateAnswers;
            case 'work': return workAnswers;
            default: return answers;
        }
    };

    const setCurrentAnswers = (newAnswers) => {
        switch (phase) {
            case 'private':
                setPrivateAnswers(newAnswers);
                break;
            case 'work':
                setWorkAnswers(newAnswers);
                break;
            default:
                setAnswers(newAnswers);
        }
    };

    const handlePhaseComplete = (finalAnswers) => {
        if (phase === 'base') {
            setPhase('modeSelect');
        } else if (phase === 'private') {
            setCurrentIndex(0);
            setPhase('work');
        } else if (phase === 'work') {
            // Calculate all scores
            const baseScores = calculateScores(answers);
            const privateScores = calculateScores({ ...answers, ...privateAnswers });
            const workScores = calculateScores({ ...answers, ...finalAnswers });

            const results = {
                scores: baseScores,
                code: getCode(baseScores),
                hasDualProfile: true,
                privateScores,
                privateCode: getCode(privateScores),
                workScores,
                workCode: getCode(workScores),
                targetType: testTarget.type,
                targetName: testTarget.name,
            };

            saveResults(results);
            navigate('/result');
        }
    };

    const handleSkipMode = () => {
        const scores = calculateScores(answers);
        const results = {
            scores,
            code: getCode(scores),
            hasDualProfile: false,
            targetType: testTarget.type,
            targetName: testTarget.name,
        };
        saveResults(results);
        navigate('/result');
    };

    const handleStartMode = () => {
        setCurrentIndex(0);
        setPhase('private');
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // Mode selection screen
    if (phase === 'modeSelect') {
        return (
            <div className="test-page">
                <div className="mode-select">
                    <div className="mode-icon">🎭</div>
                    <h2>기본 테스트 완료!</h2>
                    <p>
                        <strong>사적 모드</strong>와 <strong>업무 모드</strong>를
                        <br />비교해볼까요?
                    </p>
                    <p className="mode-desc">
                        같은 질문 12개를 각 상황별로 다시 답해주시면
                        <br />두 모드의 차이를 분석해 드려요.
                    </p>

                    <div className="mode-buttons">
                        <button className="btn-primary" onClick={handleStartMode}>
                            모드 비교 해볼래요! (2분)
                            <span className="btn-arrow">→</span>
                        </button>
                        <button className="btn-secondary" onClick={handleSkipMode}>
                            기본 결과만 볼게요
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="test-page">
            {/* Header */}
            <div className="test-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    ← 나가기
                </button>
                <div className="phase-badge">
                    {isOther && <span className="target-tag">👤 {targetName}</span>}
                    {phase === 'base' && (isOther ? '성향 테스트' : '기본 테스트')}
                    {phase === 'private' && '🏠 사적 모드'}
                    {phase === 'work' && '💼 업무 모드'}
                </div>
            </div>

            {/* Progress */}
            <div className="progress-container">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="progress-text">{currentIndex + 1} / {totalSteps}</span>
            </div>

            {/* Question */}
            <div className="question-container">
                {(phase === 'private' || phase === 'work') && (
                    <div className="mode-context">
                        {phase === 'private'
                            ? '친구, 가족, 연인과 함께할 때를 떠올려 주세요'
                            : '회사, 업무 상황을 떠올려 주세요'}
                    </div>
                )}

                <p className="question-text">{currentQuestion?.text}</p>

                <div className="likert-scale">
                    {[1, 2, 3, 4, 5, 6, 7].map((score) => (
                        <button
                            key={score}
                            className={`likert-btn ${getCurrentAnswers()[currentQuestion?.id] === score ? 'selected' : ''}`}
                            onClick={() => handleAnswer(score)}
                        >
                            <span className="likert-value">{score}</span>
                        </button>
                    ))}
                </div>

                <div className="likert-labels">
                    <span>전혀 아니다</span>
                    <span>매우 그렇다</span>
                </div>
            </div>

            {/* Navigation */}
            {currentIndex > 0 && (
                <button className="nav-back" onClick={handleBack}>
                    ← 이전 질문
                </button>
            )}
        </div>
    );
}
