
import React, { useState, useEffect, useRef } from 'react';

interface HeaderProps {
    onOpenSettings: () => void;
}

const PoliceBadgeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} {...props}>
    {/* Shield Shape */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25l-9 5v6c0 5.5 5 10 9 11.5 4-1.5 9-6 9-11.5v-6l-9-5z" className="text-cyan-400 fill-cyan-900/20" />
    {/* Star Shape */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l1.5 4h4l-3.25 2.5 1.25 4-3.5-2.5-3.5 2.5 1.25-4-3.25-2.5h4L12 6z" fill="currentColor" className="text-cyan-100" />
  </svg>
);

const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  // Define CSS variables for dynamic animation
  const [styles, setStyles] = useState<React.CSSProperties>({
    '--beam-x': '-200px', 
    '--beam-y': '0px',
    '--beam-rotation': '-45deg',
    '--beam-duration': '2s',
    '--intruder-x': '0px',
    '--intruder-y': '-80px',
    '--intruder-opacity': '0',
    '--intruder-scale': '0.7',
    '--intruder-transition': 'opacity 0.3s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', // Default transition
  } as React.CSSProperties);

  const headerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const getRandomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const patrol = () => {
      if (!isMounted.current) return;

      // Get dynamic width of container to ensure full coverage
      const width = headerRef.current ? headerRef.current.clientWidth : window.innerWidth;
      const safeHalfWidth = (width / 2) - 80; // Padding from edges

      // 30% chance to spot an intruder
      const isSpotting = Math.random() < 0.30; 

      if (isSpotting) {
        // --- SPOTTING SEQUENCE ---
        
        // 1. Setup Intruder Position (Random X within bounds, Fixed peek Y)
        const intruderX = getRandomInRange(-safeHalfWidth * 0.9, safeHalfWidth * 0.9);
        const intruderY = 10; // Peek position slightly lower
        
        // 2. Move Beam FAST to intruder position (The "Snap")
        setStyles(prev => ({
          ...prev,
          '--beam-duration': '0.5s', // Fast snap
          '--beam-x': `${intruderX}px`,
          '--beam-y': `${intruderY}px`,
          '--beam-rotation': '0deg', // Face forward
          // Pre-position intruder (hidden)
          '--intruder-x': `${intruderX}px`,
          '--intruder-y': `${intruderY}px`, 
          '--intruder-scale': '0.7',
          // SLOW REVEAL SETUP: Set a long transition duration for opacity (1.5s)
          '--intruder-transition': 'opacity 1.5s ease-out, transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
        } as React.CSSProperties));

        // 3. Reveal Intruder shortly after beam starts moving
        timeoutRef.current = window.setTimeout(() => {
             if (!isMounted.current) return;
             
             setStyles(prev => ({
                ...prev,
                '--intruder-opacity': '0.6', // Lower opacity to be "harder to notice"
                '--intruder-scale': '1.0', // Scale to normal size (base size reduced in CSS)
             } as React.CSSProperties));

             // 4. Hold briefly, then Hide QUICKLY
             // Short wait time so the beam "barely gets there" before he vanishes
             timeoutRef.current = window.setTimeout(() => {
                if (!isMounted.current) return;
                // Hide Intruder
                setStyles(prev => ({
                    ...prev,
                    '--intruder-opacity': '0',
                    '--intruder-scale': '0.7', // Shrink back
                    // FAST EXIT: Switch to a very fast transition
                    '--intruder-transition': 'opacity 0.2s ease-in, transform 0.2s ease-in'
                } as React.CSSProperties));
                
                // Resume patrol loop after hiding
                timeoutRef.current = window.setTimeout(patrol, 1000);
             }, 800); // Wait 0.8s. The slow reveal (1.5s) won't finish, he'll ghost out.

        }, 400); // Start reveal slightly before beam arrives

      } else {
        // --- ORGANIC WANDERING SEQUENCE ---
        const x = getRandomInRange(-safeHalfWidth, safeHalfWidth);
        const y = getRandomInRange(-30, 30); 
        
        const currentXStr = (styles['--beam-x'] as string) || '0px';
        const currentX = parseFloat(currentXStr.replace('px', ''));
        const deltaX = x - currentX;
        const targetRotation = Math.max(-45, Math.min(45, deltaX * 0.15)); 

        const duration = getRandomInRange(2.0, 4.5); 

        setStyles(prev => ({
            ...prev,
            '--beam-duration': `${duration}s`,
            '--beam-x': `${x}px`,
            '--beam-y': `${y}px`,
            '--beam-rotation': `${targetRotation}deg`,
            '--intruder-opacity': '0', 
            '--intruder-transition': 'opacity 0.3s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', 
        } as React.CSSProperties));

        // Schedule next move
        timeoutRef.current = window.setTimeout(patrol, duration * 1000);
      }
    };

    // Start loop
    patrol();

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <header 
        ref={headerRef}
        className="relative bg-gray-900/70 backdrop-blur-md sticky top-0 z-10 overflow-hidden"
        style={styles}
    >
      <style>{`
        @keyframes police-rotate {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .police-glow-wrapper {
            position: relative;
        }
        .police-glow-bg {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 300px;
            height: 300px;
            background: conic-gradient(
                from 0deg,
                rgba(239, 68, 68, 0) 0deg,
                rgba(239, 68, 68, 0.8) 40deg,
                rgba(239, 68, 68, 0) 80deg,
                rgba(59, 130, 246, 0) 180deg,
                rgba(59, 130, 246, 0.8) 220deg,
                rgba(59, 130, 246, 0) 260deg
            );
            border-radius: 50%;
            filter: blur(25px);
            opacity: 0;
            transform: translate(-50%, -50%);
            pointer-events: none;
            transition: opacity 0.4s ease;
            z-index: 0;
        }
        .police-glow-wrapper:hover .police-glow-bg {
            opacity: 0.6;
            animation: police-rotate 1.5s linear infinite;
        }
      `}</style>

      <div className="patrol-light-beam"></div>
      <div className="intruder-face intruder-hood" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="police-glow-wrapper flex items-center space-x-3 relative z-10 px-4 py-1 rounded-full cursor-default">
            {/* Hover Glow Effect */}
            <div className="police-glow-bg"></div>

            <PoliceBadgeIcon className="w-10 h-10 neon-icon relative z-10" />
            <div className="relative z-10">
                <svg width="220" height="40" viewBox="0 0 220 40" aria-labelledby="gpo-patrol-title">
                    <title id="gpo-patrol-title">GPO Patrol</title>
                    {/* Stroke layer */}
                    <text x="5" y="32" fontFamily="Inter, sans-serif" fontSize="26" fontWeight="bold" className="neon-text-stroke">
                        GPO Patrol
                    </text>
                    {/* Fill layer */}
                    <text x="5" y="32" fontFamily="Inter, sans-serif" fontSize="26" fontWeight="bold" className="neon-text">
                        GPO Patrol
                    </text>
                </svg>
            </div>
          </div>
          
          <div className="relative z-10">
            <button 
                onClick={onOpenSettings}
                className="p-2 text-cyan-400 hover:text-cyan-200 transition-colors bg-gray-800/50 rounded-full border border-cyan-900 hover:bg-gray-700/50"
                aria-label="Settings"
            >
                <CogIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
