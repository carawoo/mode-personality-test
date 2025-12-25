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

    // Generate a preview when results are loaded
    useEffect(() => {
        if (results) {
            const timer = setTimeout(() => {
                generatePreview();
            }, 800); // Wait a bit more for background rendering
            return () => clearTimeout(timer);
        }
    }, [results]);

    const generatePreview = async () => {
        if (!captureRef.current) return;

        try {
            const element = captureRef.current;
            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#0f172a',
                logging: false,
                width: 375,
                height: element.scrollHeight,
                windowWidth: 375,
                windowHeight: element.scrollHeight,
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
            // Re-calculate height in case of updates
            const element = captureRef.current;
            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 3,
                backgroundColor: '#0f172a',
                width: 375,
                height: element.scrollHeight,
                windowWidth: 375,
                windowHeight: element.scrollHeight,
            });

            const fileName = `모드성향테스트_${results.code}.png`;

            if (navigator.share && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], fileName, { type: 'image/png' });
                    try {
                        await navigator.share({
                            files: [file],
                            title: '모드 성향 테스트 결과',
                        });
                    } catch (err) {
                        const link = document.createElement('a');
                        link.download = fileName;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                    }
                }, 'image/png');
            } else {
                const link = document.createElement('a');
                link.download = fileName;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch (err) {
            console.error('Failed to save image:', err);
            alert('이미지 저장에 실패했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSavePDF = async () => {
        if (!captureRef.current || isGenerating) return;
        setIsGenerating(true);

        try {
            const element = captureRef.current;
            const canvas = await html2canvas(element, {
                useCORS: true,
                scale: 2,
                backgroundColor: '#0f172a',
                width: 375,
                height: element.scrollHeight,
                windowWidth: 375,
                windowHeight: element.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [375, element.scrollHeight], // Use actual pixel height
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 375, element.scrollHeight);
            pdf.save(`모드성향테스트_${results.code}.pdf`);
        } catch (err) {
            console.error('Save PDF failed:', err);
            alert('PDF 저장에 실패했습니다.');
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

            {/* Hidden capture area - rendered off-screen (left: -9999px) */}
            <div className="capture-area-container" ref={captureRef}>
                <ResultContent results={results} isCapture={true} />
            </div>
        </div>
    );
}
