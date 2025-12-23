import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  particleCount?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  rotationSpeed: number;
}

export const Confetti: React.FC<ConfettiProps> = ({
  active,
  duration = 3000,
  particleCount = 50
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const colors = [
    '#FFB86C', // Yellow
    '#00E5FF', // Pink
    '#6C4BFF', // Purple
    '#00E5FF', // Blue
    '#06FFA5', // Green
  ];

  const createParticle = (id: number): Particle => {
    const x = Math.random() * 100; // Percentage
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 4; // 4-12px
    const velocityX = (Math.random() - 0.5) * 4; // -2 to 2
    const velocityY = Math.random() * -10 - 5; // -5 to -15
    const rotation = Math.random() * 360;
    const rotationSpeed = (Math.random() - 0.5) * 10;

    return {
      id,
      x,
      y: -10,
      color,
      size,
      velocityX,
      velocityY,
      rotation,
      rotationSpeed
    };
  };

  useEffect(() => {
    if (active && !isAnimating) {
      setIsAnimating(true);
      
      // Create particles
      const newParticles = Array.from({ length: particleCount }, (_, i) => 
        createParticle(i)
      );
      setParticles(newParticles);

      // Clear after duration
      const timer = setTimeout(() => {
        setParticles([]);
        setIsAnimating(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, particleCount, duration, isAnimating]);

  if (!isAnimating || particles.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animation: `confetti-fall ${duration}ms ease-out forwards`,
            '--velocity-x': `${particle.velocityX}vw`,
            '--velocity-y': `${particle.velocityY}vh`,
            '--rotation': `${particle.rotationSpeed * 360}deg`
          } as React.CSSProperties}
        />
      ))}
      
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(var(--velocity-x, 0)) rotate(var(--rotation, 360deg));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

interface SuccessAnimationProps {
  show: boolean;
  message?: string;
  confetti?: boolean;
  duration?: number;
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  show,
  message = 'Success!',
  confetti = true,
  duration = 3000,
  onComplete
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  if (!isVisible) return null;

  return (
    <>
      {confetti && <Confetti active={isVisible} duration={duration} />}
      
      <div className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm mx-4 animate-success-bounce pointer-events-auto">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#06FFA5] to-[#00E5FF] rounded-full flex items-center justify-center mx-auto mb-4 animate-success-check">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#1E0E62] mb-2">
              {message}
            </h3>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes success-bounce {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes success-check {
          0% {
            transform: scale(0) rotate(-45deg);
          }
          50% {
            transform: scale(1.2) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
        
        .animate-success-bounce {
          animation: success-bounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .animate-success-check {
          animation: success-check 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.1s;
        }
      `}</style>
    </>
  );
};
