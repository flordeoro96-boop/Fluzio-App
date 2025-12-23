import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Eye, Zap, Type, RotateCcw, Plus, Minus, Check } from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    settings,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    increaseFontSize,
    decreaseFontSize,
    resetSettings
  } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className="relative w-full sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300 flex flex-col max-h-[90vh]"
        role="dialog"
        aria-labelledby="accessibility-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 id="accessibility-title" className="text-2xl font-clash font-bold text-gray-900">
                {t('settings.accessibility')}
              </h2>
              <p className="text-sm text-gray-500">{t('settings.customizeExperience')}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Visual Settings */}
          <section aria-labelledby="visual-settings">
            <h3 id="visual-settings" className="text-lg font-bold text-gray-900 mb-4">
              {t('settings.visualSettings')}
            </h3>

            {/* High Contrast */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t('settings.highContrast')}</h4>
                  <p className="text-sm text-gray-500">{t('settings.highContrastDesc')}</p>
                </div>
              </div>
              <button
                onClick={toggleHighContrast}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.highContrast ? 'bg-purple-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={settings.highContrast}
                aria-label="Toggle high contrast mode"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.highContrast ? 'translate-x-7' : ''
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t('settings.reduceMotion')}</h4>
                  <p className="text-sm text-gray-500">{t('settings.reduceMotionDesc')}</p>
                </div>
              </div>
              <button
                onClick={toggleReducedMotion}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.reducedMotion ? 'bg-purple-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={settings.reducedMotion}
                aria-label="Toggle reduced motion"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.reducedMotion ? 'translate-x-7' : ''
                  }`}
                />
              </button>
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Type className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t('settings.largeText')}</h4>
                  <p className="text-sm text-gray-500">{t('settings.largeTextDesc')}</p>
                </div>
              </div>
              <button
                onClick={toggleLargeText}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  settings.largeText ? 'bg-purple-600' : 'bg-gray-300'
                }`}
                role="switch"
                aria-checked={settings.largeText}
                aria-label="Toggle large text"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.largeText ? 'translate-x-7' : ''
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Text Size Control */}
          <section aria-labelledby="text-size">
            <h3 id="text-size" className="text-lg font-bold text-gray-900 mb-4">
              {t('settings.textSize')}
            </h3>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
              <button
                onClick={decreaseFontSize}
                disabled={settings.fontSize <= 75}
                className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease text size"
              >
                <Minus className="w-5 h-5 text-gray-700" />
              </button>
              
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-gray-900" aria-live="polite">
                  {settings.fontSize}%
                </div>
                <div className="text-sm text-gray-500">
                  {settings.fontSize <= 75 && t('settings.smallest')}
                  {settings.fontSize === 100 && t('settings.default')}
                  {settings.fontSize === 125 && t('settings.large')}
                  {settings.fontSize === 150 && t('settings.larger')}
                  {settings.fontSize === 175 && t('settings.veryLarge')}
                  {settings.fontSize >= 200 && t('settings.largest')}
                </div>
              </div>
              
              <button
                onClick={increaseFontSize}
                disabled={settings.fontSize >= 200}
                className="w-10 h-10 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase text size"
              >
                <Plus className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section aria-labelledby="keyboard-shortcuts">
            <h3 id="keyboard-shortcuts" className="text-lg font-bold text-gray-900 mb-4">
              {t('settings.keyboardShortcuts')}
            </h3>
            <div className="space-y-2 p-4 bg-gray-50 rounded-2xl">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{t('common.search')}</span>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 font-mono">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{t('settings.navigateTabs')}</span>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 font-mono">
                  ← →
                </kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{t('settings.closeModal')}</span>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 font-mono">
                  Esc
                </kbd>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">{t('settings.submitForm')}</span>
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 font-mono">
                  Enter
                </kbd>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={resetSettings}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            {t('settings.resetToDefault')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Check className="w-5 h-5" />
            {t('common.done')}
          </button>
        </div>
      </div>
    </div>
  );
};
