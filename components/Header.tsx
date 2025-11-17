
import React, { useState, useEffect } from 'react';

const CodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const INTRUDER_CLASSES = ['intruder-1', 'intruder-2', 'intruder-3'];

export const Header: React.FC = () => {
  const [intruderPos, setIntruderPos] = useState({ x: 0, y: -10 });
  const [intruderClass, setIntruderClass] = useState(INTRUDER_CLASSES[0]);

  useEffect(() => {
    const updateIntruder = () => {
      // Randomize position across a wide horizontal range
      const newX = (Math.random() - 0.5) * 400; 
      // Set a consistent vertical "peek" position from the top
      const newY = -10;
      setIntruderPos({ x: newX, y: newY });
      
      // Update the look of the intruder
      const randomIndex = Math.floor(Math.random() * INTRUDER_CLASSES.length);
      setIntruderClass(INTRUDER_CLASSES[randomIndex]);
    };

    // Set initial random position and look right away
    updateIntruder();

    const intervalId = setInterval(updateIntruder, 10000); // Corresponds to the animation duration

    return () => clearInterval(intervalId);
  }, []);

  return (
    <header className="relative bg-gray-900/70 backdrop-blur-md sticky top-0 z-10">
      <div className="patrol-light-beam"></div>
      <div 
        className={`intruder-face ${intruderClass}`}
        style={{
          '--intruder-initial-x': `${intruderPos.x}px`,
          '--intruder-initial-y': `${intruderPos.y}px`,
        } as React.CSSProperties}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 relative z-10">
            <CodeIcon className="w-8 h-8 neon-icon" />
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
      </div>
    </header>
  );
};