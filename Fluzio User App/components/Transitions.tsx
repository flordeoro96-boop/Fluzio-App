import React, { useEffect, useState } from 'react';

interface TabTransitionProps {
  children: React.ReactNode;
  tabKey: string;
  direction?: 'left' | 'right' | 'none';
}

export const TabTransition: React.FC<TabTransitionProps> = ({ 
  children, 
  tabKey,
  direction = 'none' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentKey, setCurrentKey] = useState(tabKey);

  useEffect(() => {
    if (tabKey !== currentKey) {
      // Exit animation
      setIsVisible(false);
      
      // Wait for exit animation, then switch content and enter
      const timer = setTimeout(() => {
        setCurrentKey(tabKey);
        setIsVisible(true);
      }, 200);
      
      return () => clearTimeout(timer);
    } else {
      // Initial mount
      setIsVisible(true);
    }
  }, [tabKey, currentKey]);

  const getTransitionClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-out';
    
    if (!isVisible) {
      // Exit state
      return `${baseClasses} opacity-0 scale-95`;
    }
    
    // Enter state
    return `${baseClasses} opacity-100 scale-100`;
  };

  return (
    <div className={getTransitionClasses()}>
      {currentKey === tabKey && children}
    </div>
  );
};

interface FadeTransitionProps {
  children: React.ReactNode;
  show: boolean;
  duration?: number;
}

export const FadeTransition: React.FC<FadeTransitionProps> = ({
  children,
  show,
  duration = 300
}) => {
  return (
    <div
      className="transition-opacity"
      style={{
        opacity: show ? 1 : 0,
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

interface SlideTransitionProps {
  children: React.ReactNode;
  show: boolean;
  from?: 'top' | 'bottom' | 'left' | 'right';
  duration?: number;
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  show,
  from = 'bottom',
  duration = 300
}) => {
  const getTransform = () => {
    if (show) return 'translate(0, 0)';
    
    switch (from) {
      case 'top':
        return 'translate(0, -100%)';
      case 'bottom':
        return 'translate(0, 100%)';
      case 'left':
        return 'translate(-100%, 0)';
      case 'right':
        return 'translate(100%, 0)';
      default:
        return 'translate(0, 0)';
    }
  };

  return (
    <div
      className="transition-transform"
      style={{
        transform: getTransform(),
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {children}
    </div>
  );
};

interface ScaleTransitionProps {
  children: React.ReactNode;
  show: boolean;
  duration?: number;
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  children,
  show,
  duration = 300
}) => {
  return (
    <div
      className="transition-all origin-center"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'scale(1)' : 'scale(0.9)',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {children}
    </div>
  );
};
