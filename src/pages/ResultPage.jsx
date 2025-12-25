import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadResults, decodeResults } from '../utils/scoring';
import ResultContent from '../components/ResultContent';
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

    return (
        <div className="result-page">
            <header className="result-header">
                <button className="back-btn" onClick={() => navigate('/')}>
                    ← 처음으로
                </button>
            </header>

            <ResultContent results={results} cardRef={cardRef} />

            <div className="result-actions">
                <button className="btn-primary" onClick={() => navigate('/share')}>
                    결과 공유하기 ✨
                </button>
                <button className="btn-secondary" onClick={() => navigate('/')}>
                    다시 테스트하기
                </button>
            </div>
        </div>
    );
}
