
import React from 'react';
import { Loader2, X } from 'lucide-react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient', 
  size?: 'sm' | 'md' | 'lg',
  isLoading?: boolean 
}> = ({ 
  children, 
  className = '', 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  ...props 
}) => {
  // Base: Capsule shape (rounded-full), Scale animation on active
  const baseStyle = "inline-flex items-center justify-center rounded-full font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transform";
  
  const sizeStyles = {
    sm: "px-4 py-2.5 text-sm min-h-[44px]",
    md: "px-6 py-3 text-sm sm:text-base min-h-[44px]",
    lg: "px-8 py-4 text-base min-h-[48px]"
  };
  
  const variants = {
    // Electric Orchid Gradient (Gold -> Berry -> Indigo)
    primary: "bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] text-white shadow-lg shadow-[#00E5FF]/30 hover:shadow-[#00E5FF]/50 border border-transparent",
    
    // Gradient alias
    gradient: "bg-gradient-to-br from-[#FFB86C] via-[#00E5FF] to-[#6C4BFF] text-white shadow-lg shadow-[#00E5FF]/30 hover:shadow-[#00E5FF]/50 border border-transparent",
    
    // Secondary: Deep Indigo
    secondary: "bg-[#1E0E62] text-white hover:bg-[#2b148a] shadow-lg shadow-[#1E0E62]/20",
    
    // Outline: Clean borders
    outline: "border-2 border-gray-200 text-[#1E0E62] bg-white hover:bg-gray-50 hover:border-[#6C4BFF]/30",
    
    // Ghost: Minimal
    ghost: "text-[#8F8FA3] hover:bg-gray-100 hover:text-[#1E0E62]",
    
    // Danger
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
  };

  return (
    <button 
      className={`${baseStyle} ${sizeStyles[size]} ${variants[variant] || variants.primary} ${className}`} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-2 mb-5">
    {label && <label className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wider ml-1">{label}</label>}
    <input 
      className={`w-full px-4 sm:px-5 py-3.5 sm:py-3 rounded-2xl border border-gray-300 bg-white focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 outline-none transition-all font-medium text-[#1E0E62] shadow-sm placeholder:text-gray-400 text-base ${className}`} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className = '', children, ...props }) => (
  <div className="flex flex-col gap-2 mb-5">
    {label && <label className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wider ml-1">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full px-4 sm:px-5 py-3.5 sm:py-3 rounded-2xl border border-gray-300 bg-white focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 outline-none transition-all appearance-none font-medium text-[#1E0E62] shadow-sm text-base ${className}`} 
        {...props} 
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="flex flex-col gap-2 mb-5">
    {label && <label className="text-xs font-bold text-[#8F8FA3] uppercase tracking-wider ml-1">{label}</label>}
    <textarea 
      className={`w-full px-4 sm:px-5 py-3.5 sm:py-3 rounded-2xl border border-gray-300 bg-white focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 outline-none transition-all resize-none font-medium text-[#1E0E62] shadow-sm text-base ${className}`} 
      {...props} 
    />
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white/90 backdrop-blur-md rounded-3xl shadow-[0_10px_40px_rgba(114,9,183,0.08)] border border-white ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform duration-200' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ text: string, color?: string }> = ({ text, color = "bg-gray-100 text-[#8F8FA3]" }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${color}`}>
    {text}
  </span>
);

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1E0E62]/40 backdrop-blur-md">
      <div className="bg-white rounded-[24px] sm:rounded-[32px] w-full max-w-full sm:max-w-md mx-4 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/50 max-h-[90vh] flex flex-col">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-50 flex justify-between items-center bg-white/80 backdrop-blur-xl flex-shrink-0">
           <h3 className="font-clash font-bold text-lg sm:text-xl text-[#1E0E62] tracking-tight">{title}</h3>
           <button onClick={onClose} className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:text-[#1E0E62] hover:bg-gray-100 transition-all active:scale-95" aria-label="Close modal">
             <X className="w-5 h-5" />
           </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
           {children}
        </div>
      </div>
    </div>
  );
};