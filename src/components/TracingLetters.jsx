import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';
import { speakName } from '../sounds';

const LETTER_HINTS = {
  A: { word: 'Apple', emoji: '🍎' },
  B: { word: 'Bear', emoji: '🐻' },
  C: { word: 'Cat', emoji: '🐱' },
  D: { word: 'Dog', emoji: '🐶' },
  E: { word: 'Elephant', emoji: '🐘' },
  F: { word: 'Fish', emoji: '🐟' },
  G: { word: 'Grapes', emoji: '🍇' },
  H: { word: 'House', emoji: '🏠' },
  I: { word: 'Ice cream', emoji: '🍦' },
  J: { word: 'Juice', emoji: '🧃' },
  K: { word: 'Kite', emoji: '🪁' },
  L: { word: 'Lion', emoji: '🦁' },
  M: { word: 'Moon', emoji: '🌙' },
  N: { word: 'Nest', emoji: '🪺' },
  O: { word: 'Orange', emoji: '🍊' },
  P: { word: 'Penguin', emoji: '🐧' },
  Q: { word: 'Queen', emoji: '👸' },
  R: { word: 'Rainbow', emoji: '🌈' },
  S: { word: 'Sun', emoji: '☀️' },
  T: { word: 'Tree', emoji: '🌳' },
  U: { word: 'Umbrella', emoji: '☂️' },
  V: { word: 'Violin', emoji: '🎻' },
  W: { word: 'Whale', emoji: '🐋' },
  X: { word: 'Xylophone', emoji: '🎵' },
  Y: { word: 'Yacht', emoji: '⛵' },
  Z: { word: 'Zebra', emoji: '🦓' },
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function drawGuideLetter(ctx, letter, w, h) {
  ctx.clearRect(0, 0, w, h);
  // Dotted guide letter
  ctx.save();
  ctx.font = `bold ${Math.min(w, h) * 0.7}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(100, 149, 237, 0.4)';
  ctx.strokeText(letter, w / 2, h / 2);
  // Faint fill
  ctx.fillStyle = 'rgba(100, 149, 237, 0.1)';
  ctx.fillText(letter, w / 2, h / 2);
  ctx.restore();
}

export default function TracingLetters({ onBack }) {
  const { t, lang } = useLanguage();
  const [letterIndex, setLetterIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [showDone, setShowDone] = useState(false);
  const canvasRef = useRef(null);
  const guideCanvasRef = useRef(null);
  const lastPosRef = useRef(null);

  const letter = LETTERS[letterIndex];
  const hint = LETTER_HINTS[letter];
  const canvasSize = Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 40 : 320);

  useEffect(() => {
    speakName(letter, lang).catch(() => {});
    setStrokeCount(0);
    setShowDone(false);
  }, [letter, lang]);

  useEffect(() => {
    const guideCanvas = guideCanvasRef.current;
    if (guideCanvas) {
      const ctx = guideCanvas.getContext('2d');
      drawGuideLetter(ctx, letter, canvasSize, canvasSize);
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    }
  }, [letter, canvasSize]);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }, []);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPosRef.current = getPos(e);
  }, [getPos]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    const last = lastPosRef.current;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#6C5CE7';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPosRef.current = pos;
  }, [isDrawing, getPos]);

  const endDraw = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      setStrokeCount(c => {
        const next = c + 1;
        if (next >= 2) setShowDone(true);
        return next;
      });
      lastPosRef.current = null;
    }
  }, [isDrawing]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasSize, canvasSize);
    }
    setStrokeCount(0);
    setShowDone(false);
  };

  const prevLetter = () => {
    setLetterIndex(i => Math.max(0, i - 1));
  };

  const nextLetter = () => {
    setLetterIndex(i => Math.min(25, i + 1));
  };

  const speakCurrent = () => {
    speakName(`${letter} for ${hint.word}`, lang).catch(() => {});
  };

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>{t?.back || '←'}</button>
        <h2 className="game-title">{t?.tracingLetters || 'Trace Letters'}</h2>
        <span style={{ fontSize: 14, color: '#888' }}>
          {letterIndex + 1}/26
        </span>
      </div>

      <div style={{ textAlign: 'center', margin: '8px 0' }}>
        <span style={{ fontSize: 20, fontWeight: 'bold', color: '#6C5CE7' }}>
          {letter} {t?.forWord || 'for'} {hint.word} {hint.emoji}
        </span>
      </div>

      <div style={{
        position: 'relative', width: canvasSize, height: canvasSize,
        margin: '0 auto', borderRadius: 16,
        border: '3px dashed #ccc', backgroundColor: '#FAFAFA',
        touchAction: 'none',
      }}>
        <canvas
          ref={guideCanvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            position: 'absolute', top: 0, left: 0,
            borderRadius: 16, pointerEvents: 'none',
          }}
        />
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          style={{
            position: 'absolute', top: 0, left: 0,
            borderRadius: 16, cursor: 'crosshair',
          }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: 12,
        marginTop: 16, flexWrap: 'wrap',
      }}>
        <button onClick={prevLetter} disabled={letterIndex === 0} style={{
          padding: '12px 24px', borderRadius: 12, border: 'none',
          fontSize: 20, fontWeight: 'bold', cursor: 'pointer',
          backgroundColor: letterIndex === 0 ? '#DDD' : '#74B9FF',
          color: '#FFF',
        }}>
          ← {t?.prev || 'Prev'}
        </button>

        <button onClick={clearCanvas} style={{
          padding: '12px 24px', borderRadius: 12, border: 'none',
          fontSize: 20, fontWeight: 'bold', cursor: 'pointer',
          backgroundColor: '#FDCB6E', color: '#FFF',
        }}>
          🗑️ {t?.clear || 'Clear'}
        </button>

        <button onClick={speakCurrent} style={{
          padding: '12px 24px', borderRadius: 12, border: 'none',
          fontSize: 20, fontWeight: 'bold', cursor: 'pointer',
          backgroundColor: '#A29BFE', color: '#FFF',
        }}>
          🔊
        </button>

        <button onClick={nextLetter} disabled={letterIndex === 25} style={{
          padding: '12px 24px', borderRadius: 12, border: 'none',
          fontSize: 20, fontWeight: 'bold', cursor: 'pointer',
          backgroundColor: letterIndex === 25 ? '#DDD' : '#00B894',
          color: '#FFF',
        }}>
          {t?.next || 'Next'} →
        </button>
      </div>

      {showDone && (
        <div style={{
          textAlign: 'center', marginTop: 12, fontSize: 24,
          color: '#00B894', fontWeight: 'bold',
          animation: 'fadeIn 0.5s ease',
        }}>
          ⭐ {t?.greatJob || 'Great job!'} ⭐
        </div>
      )}
    </div>
  );
}
