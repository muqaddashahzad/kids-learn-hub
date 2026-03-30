import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '../LanguageContext';

const NOTES = [
  { name: 'C', freq: 261.63, color: '#FF6B6B' },
  { name: 'D', freq: 293.66, color: '#FF9F43' },
  { name: 'E', freq: 329.63, color: '#FECA57' },
  { name: 'F', freq: 349.23, color: '#48DBFB' },
  { name: 'G', freq: 392.00, color: '#0ABDE3' },
  { name: 'A', freq: 440.00, color: '#BB8FCE' },
  { name: 'B', freq: 493.88, color: '#A29BFE' },
  { name: 'C2', freq: 523.25, color: '#FD79A8' },
];

const DRUM_PADS = [
  { name: 'Kick', color: '#E74C3C', emoji: '🥁', type: 'kick' },
  { name: 'Snare', color: '#3498DB', emoji: '🪘', type: 'snare' },
  { name: 'Hi-Hat', color: '#F39C12', emoji: '🔔', type: 'hihat' },
  { name: 'Tom', color: '#2ECC71', emoji: '💥', type: 'tom' },
  { name: 'Clap', color: '#9B59B6', emoji: '👏', type: 'clap' },
  { name: 'Cymbal', color: '#1ABC9C', emoji: '✨', type: 'cymbal' },
];

const TABS = ['piano', 'xylophone', 'drums'];

function getAudioContext(ref) {
  if (!ref.current) {
    ref.current = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ref.current.state === 'suspended') ref.current.resume();
  return ref.current;
}

function playTone(ctx, freq, duration = 0.4, type = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playDrum(ctx, type) {
  const now = ctx.currentTime;
  if (type === 'kick') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
  } else if (type === 'snare') {
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    src.connect(gain); gain.connect(ctx.destination);
    src.start(now);
  } else if (type === 'hihat') {
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 7000;
    src.buffer = buffer;
    gain.gain.setValueAtTime(0.2, now);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start(now);
  } else if (type === 'tom') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.25);
  } else if (type === 'clap') {
    for (let j = 0; j < 3; j++) {
      const bufSz = ctx.sampleRate * 0.02;
      const buf = ctx.createBuffer(1, bufSz, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSz; i++) d[i] = (Math.random() * 2 - 1);
      const s = ctx.createBufferSource();
      const g = ctx.createGain();
      s.buffer = buf;
      g.gain.setValueAtTime(0.25, now + j * 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + j * 0.015 + 0.04);
      s.connect(g); g.connect(ctx.destination);
      s.start(now + j * 0.015);
    }
  } else {
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 5000;
    src.buffer = buffer;
    gain.gain.setValueAtTime(0.15, now);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start(now);
  }
}

export default function MusicPlay({ onBack }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('piano');
  const [activeKey, setActiveKey] = useState(null);
  const audioCtxRef = useRef(null);

  const handlePianoKey = useCallback((note, index) => {
    const ctx = getAudioContext(audioCtxRef);
    playTone(ctx, note.freq, 0.6, 'sine');
    setActiveKey(index);
    setTimeout(() => setActiveKey(null), 200);
  }, []);

  const handleXyloKey = useCallback((note, index) => {
    const ctx = getAudioContext(audioCtxRef);
    playTone(ctx, note.freq, 0.8, 'triangle');
    setActiveKey(index);
    setTimeout(() => setActiveKey(null), 200);
  }, []);

  const handleDrum = useCallback((pad, index) => {
    const ctx = getAudioContext(audioCtxRef);
    playDrum(ctx, pad.type);
    setActiveKey(100 + index);
    setTimeout(() => setActiveKey(null), 150);
  }, []);

  const tabLabels = {
    piano: t?.piano || '🎹 Piano',
    xylophone: t?.xylophone || '🎵 Xylophone',
    drums: t?.drums || '🥁 Drums',
  };

  return (
    <div className="game-screen">
      <div className="game-header">
        <button className="back-btn" onClick={onBack}>{t?.back || '←'}</button>
        <h2 className="game-title">{t?.musicPlay || 'Music Play'}</h2>
        <span />
      </div>

      <div style={{
        display: 'flex', gap: 8, justifyContent: 'center',
        margin: '12px 0', flexWrap: 'wrap',
      }}>
        {TABS.map(tb => (
          <button key={tb} onClick={() => { setTab(tb); setActiveKey(null); }} style={{
            padding: '10px 18px', borderRadius: 20, border: 'none',
            fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
            backgroundColor: tab === tb ? '#6C5CE7' : '#DDD',
            color: tab === tb ? '#FFF' : '#333',
            transition: 'all 0.2s',
          }}>
            {tabLabels[tb]}
          </button>
        ))}
      </div>

      <div className="display-area" style={{ padding: 16, minHeight: 300 }}>
        {tab === 'piano' && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 4,
            flexWrap: 'wrap', padding: '20px 0',
          }}>
            {NOTES.map((note, i) => (
              <button
                key={i}
                onClick={() => handlePianoKey(note, i)}
                onTouchStart={(e) => { e.preventDefault(); handlePianoKey(note, i); }}
                style={{
                  width: 65, height: 140, borderRadius: '0 0 12px 12px',
                  border: '2px solid #ccc', cursor: 'pointer',
                  backgroundColor: activeKey === i ? note.color : '#FAFAFA',
                  boxShadow: activeKey === i
                    ? `0 0 20px ${note.color}`
                    : '0 4px 8px rgba(0,0,0,0.15)',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-end', alignItems: 'center',
                  paddingBottom: 12, fontSize: 18, fontWeight: 'bold',
                  color: activeKey === i ? '#FFF' : '#555',
                  transition: 'all 0.1s',
                  transform: activeKey === i ? 'translateY(2px)' : 'none',
                }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: '50%',
                  backgroundColor: note.color, marginBottom: 6,
                }} />
                {note.name}
              </button>
            ))}
          </div>
        )}

        {tab === 'xylophone' && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            gap: 6, padding: '20px 0', flexWrap: 'wrap',
          }}>
            {NOTES.map((note, i) => {
              const height = 200 - i * 16;
              return (
                <button
                  key={i}
                  onClick={() => handleXyloKey(note, i)}
                  onTouchStart={(e) => { e.preventDefault(); handleXyloKey(note, i); }}
                  style={{
                    width: 50, height, borderRadius: 8,
                    border: 'none', cursor: 'pointer',
                    backgroundColor: activeKey === i
                      ? '#FFF'
                      : note.color,
                    boxShadow: activeKey === i
                      ? `0 0 20px ${note.color}, inset 0 0 20px ${note.color}`
                      : '0 3px 6px rgba(0,0,0,0.2)',
                    display: 'flex', justifyContent: 'center',
                    alignItems: 'center', fontSize: 16,
                    fontWeight: 'bold', color: '#FFF',
                    transition: 'all 0.1s',
                    transform: activeKey === i ? 'scaleY(0.95)' : 'none',
                  }}
                >
                  {note.name}
                </button>
              );
            })}
          </div>
        )}

        {tab === 'drums' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16, padding: 16, maxWidth: 400, margin: '0 auto',
          }}>
            {DRUM_PADS.map((pad, i) => (
              <button
                key={i}
                onClick={() => handleDrum(pad, i)}
                onTouchStart={(e) => { e.preventDefault(); handleDrum(pad, i); }}
                style={{
                  width: '100%', aspectRatio: '1', borderRadius: '50%',
                  border: 'none', cursor: 'pointer',
                  backgroundColor: activeKey === 100 + i ? '#FFF' : pad.color,
                  boxShadow: activeKey === 100 + i
                    ? `0 0 30px ${pad.color}`
                    : '0 4px 12px rgba(0,0,0,0.25)',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center',
                  fontSize: 36, transition: 'all 0.1s',
                  transform: activeKey === 100 + i ? 'scale(0.9)' : 'none',
                  minHeight: 80,
                }}
              >
                <span>{pad.emoji}</span>
                <span style={{ fontSize: 12, color: '#FFF', fontWeight: 'bold', marginTop: 4 }}>
                  {pad.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', color: '#888', fontSize: 14, marginTop: 8 }}>
        {t?.tapToPlay || 'Tap to play! 🎶'}
      </p>
    </div>
  );
}
