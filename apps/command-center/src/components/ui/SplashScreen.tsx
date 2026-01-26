/**
 * Klarity Splash Screen
 * Shows branded welcome screen on app startup
 */

import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isReady, setIsReady] = useState(false);

  // Delay before splash becomes dismissible (prevents accidental dismissal)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2000); // 2 second delay before clickable

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isReady) {
      onComplete();
    }
  };

  // Handle keyboard events - block when not ready, dismiss on any key when ready
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (!isReady) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        e.preventDefault();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyboard, true);
    return () => window.removeEventListener('keydown', handleKeyboard, true);
  }, [isReady, onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center"
      onClick={handleDismiss}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Logo */}
      <div className="mb-8 animate-fade-in">
        <KlarityLogoLarge />
      </div>

      {/* Wordmark */}
      <h1 className="text-5xl font-bold text-white font-display mb-4 tracking-tight animate-fade-in">
        Klarity
      </h1>

      {/* Tagline */}
      <p className="text-sm uppercase tracking-[0.3em] text-zinc-400 mb-6 animate-fade-in">
        Declutter. Design. Deploy.
      </p>

      {/* Description */}
      <p className="text-zinc-500 text-center max-w-md leading-relaxed mb-10 animate-fade-in">
        Klarity helps you declutter your project chaos,
        <br />
        design with clarity, and deploy with confidence.
      </p>

      {/* Brand color bar */}
      <div className="flex gap-2 mt-8 animate-fade-in">
        <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: '#6366f1' }} />
        <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: '#a78bfa' }} />
        <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: '#22d3ee' }} />
      </div>

      {/* Click to continue hint - only show when ready */}
      <p
        className={`absolute bottom-8 text-xs transition-opacity duration-300 ${
          isReady ? 'text-zinc-500 cursor-pointer' : 'text-zinc-700'
        }`}
      >
        {isReady ? 'Press any key or click to continue' : 'Loading...'}
      </p>
    </div>
  );
}

function KlarityLogoLarge() {
  return (
    <svg className="w-24 h-24" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="splash-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {/* Magnifying glass ring */}
      <circle cx="32" cy="28" r="20" fill="none" stroke="url(#splash-gradient)" strokeWidth="3" />
      {/* K letter - vertical bar */}
      <rect x="24" y="14" width="4" height="28" fill="#a78bfa" />
      {/* K letter - arms */}
      <path d="M28 28 L40 14 L44 14 L44 18 L32 28 L44 38 L44 42 L40 42 L28 28" fill="#6366f1" />
      {/* Handle */}
      <line x1="46" y1="42" x2="58" y2="54" stroke="#a78bfa" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
