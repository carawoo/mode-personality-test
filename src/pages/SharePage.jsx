import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadResults, encodeResults } from '../utils/scoring';
import { getCodeDescription } from '../utils/results';
import copyBank from '../data/copyBank.json';
import '../styles/share.css';

export default function SharePage() {
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        const saved = loadResults();
        if (saved) {
            setResults(saved);
        } else {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        if (results && canvasRef.current) {
            drawResultCard();
        }
    }, [results]);

    const drawResultCard = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = 600;
        const height = 800;

        canvas.width = width;
        canvas.height = height;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Decorative circles
        ctx.fillStyle = 'rgba(147, 51, 234, 0.15)';
        ctx.beginPath();
        ctx.arc(100, 150, 150, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.beginPath();
        ctx.arc(500, 650, 180, 0, Math.PI * 2);
        ctx.fill();

        // Title
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '500 16px Pretendard, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('나의 모드 성향', width / 2, 60);

        // Main code
        const codeGradient = ctx.createLinearGradient(0, 100, width, 200);
        codeGradient.addColorStop(0, '#9333ea');
        codeGradient.addColorStop(1, '#3b82f6');
        ctx.fillStyle = codeGradient;
        ctx.font = '900 80px Pretendard, system-ui, sans-serif';
        ctx.fillText(results.code, width / 2, 150);

        // Code description
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '500 18px Pretendard, system-ui, sans-serif';
        ctx.fillText(getCodeDescription(results.code), width / 2, 190);

        // Dual profile if exists
        let yOffset = 250;
        if (results.hasDualProfile) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '500 14px Pretendard, system-ui, sans-serif';
            ctx.fillText('🎭 모드별 프로필', width / 2, yOffset);
            yOffset += 40;

            // Private
            ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
            roundRect(ctx, 50, yOffset - 20, 230, 70, 12);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 28px Pretendard, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('🏠 ' + results.privateCode, 70, yOffset + 25);

            // Work
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            roundRect(ctx, 320, yOffset - 20, 230, 70, 12);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillText('💼 ' + results.workCode, 340, yOffset + 25);

            yOffset += 100;
            ctx.textAlign = 'center';
        }

        // Axis bars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '500 14px Pretendard, system-ui, sans-serif';
        ctx.fillText('📊 축별 점수', width / 2, yOffset);
        yOffset += 30;

        const axes = ['EI', 'SN', 'TF', 'JP'];
        axes.forEach((axis, i) => {
            const y = yOffset + i * 50;
            const info = copyBank.axisNames[axis];
            const score = results.scores[axis];

            // Labels
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '400 12px Pretendard, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(info.left, 50, y);
            ctx.textAlign = 'right';
            ctx.fillText(info.right, 550, y);

            // Bar background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            roundRect(ctx, 50, y + 8, 500, 12, 6);
            ctx.fill();

            // Marker
            const markerX = 50 + (score / 100) * 500;
            ctx.fillStyle = '#9333ea';
            ctx.beginPath();
            ctx.arc(markerX, y + 14, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '700 8px Pretendard, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(score.toString(), markerX, y + 17);
        });

        yOffset += 220;

        // One-line summary
        if (results.hasDualProfile) {
            ctx.fillStyle = 'rgba(147, 51, 234, 0.3)';
            roundRect(ctx, 50, yOffset, 500, 60, 12);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '600 16px Pretendard, system-ui, sans-serif';
            ctx.textAlign = 'center';

            const privateJ = results.privateCode.includes('J');
            const workJ = results.workCode.includes('J');
            let summary = '';
            if (workJ && !privateJ) {
                summary = '"일할 땐 딱딱, 놀 땐 풀림" 타입';
            } else if (!workJ && privateJ) {
                summary = '"일할 땐 유연, 놀 땐 계획" 타입';
            } else {
                summary = `업무 ${results.workCode} / 사적 ${results.privateCode}`;
            }
            ctx.fillText(summary, width / 2, yOffset + 37);
            yOffset += 80;
        }

        // Footer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '400 12px Pretendard, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('모드 성향 테스트 • modetest.vercel.app', width / 2, height - 40);
    };

    const roundRect = (ctx, x, y, width, height, radius) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    };

    const handleDownload = async () => {
        const canvas = canvasRef.current;
        const fileName = `모드성향테스트_${results.code}.png`;

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            if (!blob) return;

            // Try Web Share API for mobile (allows saving to Photos)
            if (navigator.share && navigator.canShare) {
                try {
                    const file = new File([blob], fileName, { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: '나의 모드 성향',
                            text: `나의 모드 성향: ${results.code}`,
                        });
                        return;
                    }
                } catch (err) {
                    // Share cancelled or failed, fall through to download
                    if (err.name !== 'AbortError') {
                        console.log('Share failed, falling back to download');
                    } else {
                        return; // User cancelled share
                    }
                }
            }

            // Fallback: Direct download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/png', 1.0);
    };

    const handleCopyLink = async () => {
        const encoded = encodeResults(results);
        const url = `${window.location.origin}/result?r=${encoded}`;

        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Fallback
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
                <p className="share-desc">이미지를 저장하거나 링크를 복사해서 공유하세요!</p>

                <div className="canvas-wrapper">
                    <canvas ref={canvasRef}></canvas>
                </div>

                <div className="share-buttons">
                    <button className="btn-primary" onClick={handleDownload}>
                        📥 이미지 저장
                    </button>
                    <button className="btn-secondary" onClick={handleCopyLink}>
                        {copied ? '✅ 복사됨!' : '🔗 링크 복사'}
                    </button>
                </div>
            </div>
        </div>
    );
}
