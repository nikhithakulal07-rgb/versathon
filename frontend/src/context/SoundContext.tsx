import React, { createContext, useContext, useState } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (type: 'correct' | 'wrong' | 'levelUp' | 'click') => void;
  playCorrect: () => void;
  playWrong: () => void;
  playLevelUp: () => void;
  playClick: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [soundEnabled, setSoundEnabled] = useState(false); // OFF by default

  const toggleSound = () => setSoundEnabled(prev => !prev);

  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    return AudioCtx ? new AudioCtx() : null;
  };

  const playTone = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  };

  const playCorrect = () => {
    if (!soundEnabled) return;
    playTone(523.25, 0.1, 'sine'); // C5
    setTimeout(() => playTone(659.25, 0.15, 'sine'), 100); // E5
  };

  const playWrong = () => {
    if (!soundEnabled) return;
    playTone(220, 0.2, 'triangle');
  };

  const playLevelUp = () => {
    if (!soundEnabled) return;
    playTone(440, 0.1, 'triangle');
    setTimeout(() => playTone(554.37, 0.1, 'triangle'), 100);
    setTimeout(() => playTone(659.25, 0.25, 'sine'), 200);
  };

  const playClick = () => {
    if (!soundEnabled) return;
    playTone(800, 0.05, 'sine');
  };

  const playSound = (type: 'correct' | 'wrong' | 'levelUp' | 'click') => {
    switch (type) {
      case 'correct':
        playCorrect();
        break;
      case 'wrong':
        playWrong();
        break;
      case 'levelUp':
        playLevelUp();
        break;
      case 'click':
        playClick();
        break;
    }
  };

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, playSound, playCorrect, playWrong, playLevelUp, playClick }}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within a SoundProvider');
  return context;
};
