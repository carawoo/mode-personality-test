import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { loadResults, encodeResults } from '../utils/scoring';
import ResultContent from '../components/ResultContent';
import '../styles/share.css';

export default function SharePage() {
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const captureRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        const saved = loadResults();
        if (saved) {
            setResults(saved);
        } else {
            navigate('/');
        }
    }, [navigate]);

    // Generate a preview if possible (optional, but helps user see what they are saving)
    useEffect(() => {
        if (results) {
            // Give a tiny bit of time for the hidden content to render
            const timer = setTimeout(() => {
                generatePreview();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [results]);

    const generatePreview = async () => {
        if (!captureRef.current) return;
        try {
            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#0f172a',
                logging: false,
                width: 375,
                height: captureRef.current.scrollHeight,
                windowWidth: 375,
                windowHeight: captureRef.current.scrollHeight,
            });
            setPreviewUrl(canvas.toDataURL('image/png'));
        } catch (err) {
            console.error('Failed to generate preview:', err);
        }
    };

    const handleSaveImage = async () => {
        if (!captureRef.current || isGenerating) return;
        setIsGenerating(true);

        try {
            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                scale: 3, // Higher quality for saving
                backgroundColor: '#0f172a',
                width: 375,
                height: captureRef.current.scrollHeight,
                windowWidth: 375,
                windowHeight: captureRef.current.scrollHeight,
            });

            const fileName = `모드성향테스트_${results.code}.png`;
            const image = canvas.toDataURL('image/png', 1.0);

            // Web Share API for mobile save to photos
            if (navigator.share && navigator.canShare) {
                const blob = await (await fetch(image)).blob();
                const file = new File([blob], fileName, { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: '나의 모드 성향 결과',
                    });
                    setIsGenerating(false);
                    return;
                }
            }

            const link = document.createElement('a');
            link.href = image;
            link.download = fileName;
            link.click();
        } catch (err) {
            console.error('Save image failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSavePDF = async () => {
        if (!captureRef.current || isGenerating) return;
        setIsGenerating(true);

        try {
            const canvas = await html2canvas(captureRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#0f172a',
                width: 375,
                height: captureRef.current.scrollHeight,
                windowWidth: 375,
                windowHeight: captureRef.current.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2], // Match half-scale for reasonable size
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`모드성향테스트_${results.code}.pdf`);
        } catch (err) {
            console.error('Save PDF failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = async () => {
        const encoded = encodeResults(results);
        const url = `${window.location.origin}/result?r=${encoded}`;

        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!results) {
        return (
            <div className="share-page loading">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="share-page">
            <header className="share-header">
                <button className="back-btn" onClick={() => navigate('/result')}>
                    ← 결과로 돌아가기
                </button>
            </header>

            <div className="share-content">
                <h1>결과 공유하기</h1>
                <p className="share-desc">모바일 최적화된 고화질 이미지와 PDF로 저장해보세요!</p>

                <div className="preview-wrapper">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" />
                    ) : (
                        <div className="loader-small">이미지 생성 중...</div>
                    )}
                </div>

                <div className="share-buttons">
                    <div className="export-options">
                        <button
                            className="btn-primary"
                            onClick={handleSaveImage}
                            disabled={isGenerating}
                        >
                            {isGenerating ? '처리 중...' : '📥 이미지 저장'}
                        </button>
                        <button
                            className="btn-primary"
                            style={{ background: '#ef4444' }}
                            onClick={handleSavePDF}
                            disabled={isGenerating}
                        >
                            {isGenerating ? '처리 중...' : '📄 PDF 저장'}
                        </button>
                    </div>
                    <button className="btn-secondary" onClick={handleCopyLink}>
                        {copied ? '✅ 복사됨!' : '🔗 결과 링크 복사'}
                    </button>
                </div>
            </div>

            {/* Hidden capture area */}
            <div className="capture-area-container" ref={captureRef}>
                <ResultContent results={results} isCapture={true} />
            </div>
        </div>
    );
}
