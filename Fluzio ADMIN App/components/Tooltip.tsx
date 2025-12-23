import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: 'help' | 'info' | 'none';
  maxWidth?: string;
  trigger?: 'hover' | 'click';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  icon = 'help',
  maxWidth = '250px',
  trigger = 'hover'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (trigger !== 'click') return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, trigger]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent';
      case 'bottom':
        return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent';
      case 'left':
        return 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent';
      case 'right':
        return 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent';
      default:
        return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent';
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const IconComponent = icon === 'help' ? HelpCircle : icon === 'info' ? Info : null;

  return (
    <div className="relative inline-flex items-center">
      {/* Trigger Element */}
      <div
        ref={triggerRef}
        className="inline-flex items-center cursor-help"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children || (
          IconComponent && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Show help"
            >
              <IconComponent className="w-4 h-4" />
            </button>
          )
        )}
      </div>

      {/* Tooltip Content */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-[100] ${getPositionClasses()} animate-in fade-in zoom-in-95 duration-200`}
          style={{ maxWidth }}
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-xl">
            {content}
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
            style={{ borderWidth: '6px' }}
          />
        </div>
      )}
    </div>
  );
};

// Pre-configured tooltip variants for common use cases
export const HelpTooltip: React.FC<{ content: string; position?: 'top' | 'bottom' | 'left' | 'right' }> = (props) => (
  <Tooltip icon="help" trigger="hover" {...props} />
);

export const InfoTooltip: React.FC<{ content: string; position?: 'top' | 'bottom' | 'left' | 'right' }> = (props) => (
  <Tooltip icon="info" trigger="hover" {...props} />
);

export const ClickTooltip: React.FC<{ content: string; children: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right' }> = (props) => (
  <Tooltip icon="none" trigger="click" {...props} />
);
