import { useState, useMemo } from 'react';
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

    // Questions for comparison (12 questions)
    const comparisonQuestions = useMemo(() => {
        const filtered = questions.filter((q) => modeQuestionIds.includes(q.id));
        return shuffleArray(filtered);
    }, []);

    const currentQuestion = comparisonQuestions[currentIndex];
    const progress = ((currentIndex + 1) / comparisonQuestions.length) * 100;

    const handleAnswer = (mode, score) => {
        if (mode === 'private') {
            setPrivateAnswers((prev) => ({ ...prev, [currentQuestion.id]: score }));
        } else {
            setWorkAnswers((prev) => ({ ...prev, [currentQuestion.id]: score }));
        }
    };

    const handleNext = () => {
        if (currentIndex < comparisonQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            window.scrollTo(0, 0);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleComplete = () => {
        const privateScores = calculateScores(privateAnswers);
        const workScores = calculateScores(workAnswers);

        // For comparison-first flow, 'scores' (the base) is just the workScores or privateScores
        // But to maintain compatibility with ResultContent, we'll provide both.
        // We can also compute a 'base' score as an average if needed, but the UI focuses on the two modes now.
        const results = {
            scores: workScores, // default base to work scores for compatibility
            code: getCode(workScores),
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
    };

    const isCurrentQuestionAnswered =
        privateAnswers[currentQuestion?.id] !== undefined &&
        workAnswers[currentQuestion?.id] !== undefined;

    return (
        <div className="test-page">
            {/* Header */}
            <div className="test-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    ← 나가기
                </button>
                <div className="phase-badge">
                    {isOther && <span className="target-tag">👤 {targetName}</span>}
                    🎭 모드 비교 테스트
                </div>
            </div>

            {/* Progress */}
            <div className="progress-container">
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="progress-text">
                    {currentIndex + 1} / {comparisonQuestions.length}
                </span>
            </div>

            {/* Question */}
            <div className="question-container">
                <p className="question-text">{currentQuestion?.text}</p>

                {/* Private Mode Selection */}
                <div className="mode-input-section private">
                    <div className="mode-context private">
                        🏠 <strong>사적 모드</strong>의 나는?
                        <span className="mode-sub">친구, 가족과 함께할 때</span>
                    </div>
                    <div className="likert-scale">
                        {[1, 2, 3, 4, 5, 6, 7].map((score) => (
                            <button
                                key={score}
                                className={`likert-btn ${privateAnswers[currentQuestion.id] === score ? 'selected' : ''}`}
                                onClick={() => handleAnswer('private', score)}
                            >
                                <span className="likert-value">{score}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Work Mode Selection */}
                <div className="mode-input-section work">
                    <div className="mode-context work">
                        💼 <strong>업무 모드</strong>의 나는?
                        <span className="mode-sub">회사, 업무 상황일 때</span>
                    </div>
                    <div className="likert-scale">
                        {[1, 2, 3, 4, 5, 6, 7].map((score) => (
                            <button
                                key={score}
                                className={`likert-btn ${workAnswers[currentQuestion.id] === score ? 'selected' : ''}`}
                                onClick={() => handleAnswer('work', score)}
                            >
                                <span className="likert-value">{score}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="likert-labels">
                    <span>전혀 아니다</span>
                    <span>매우 그렇다</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="test-nav">
                {currentIndex > 0 ? (
                    <button className="btn-nav-outline" onClick={handleBack}>
                        이전
                    </button>
                ) : (
                    <div></div>
                )}
                <button
                    className="btn-nav-primary"
                    onClick={handleNext}
                    disabled={!isCurrentQuestionAnswered}
                >
                    {currentIndex < comparisonQuestions.length - 1 ? '다음 질문' : '결과 보기'}
                </button>
            </div>
        </div>
    );
}
