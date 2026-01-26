/**
 * Enhanced AI Assistant Modal - Next Generation Support
 * Features: Real-time context, action buttons, visual aids, memory, multi-language, voice, and more
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X, Send, Bot, Sparkles, Loader2, Copy, ThumbsUp, ThumbsDown,
  Minimize2, Maximize2, Mic, Volume2, Image, BarChart3, ExternalLink,
  CheckCircle, AlertCircle, ArrowRight, ZapIcon, Globe
} from 'lucide-react';
import { chatWithAssistant, getQuickSuggestions } from '../services/openaiService';
import { fetchUserContext, getContextualActions, UserContextData } from '../services/aiContextService';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, getDoc, updateDoc, Timestamp } from '../services/firestoreCompat';
import { db } from '../services/apiService';
import './AIAssistantModal.css';

/**
 * Simple markdown-to-HTML formatter for AI messages
 */
const formatMessageContent = (content: string): string => {
  return content
    // Bold: **text** -> <strong>text</strong>
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* -> <em>text</em>
    .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
    // Numbered lists with colons: 1. **Title**: Description
    .replace(/^(\d+)\.\s+\*\*(.+?)\*\*:\s+(.+)$/gm, '<li><strong>$2:</strong> $3</li>')
    // Numbered lists: 1. text -> <li>text</li>
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
    // Bullet points: - text or • text -> <li>text</li>
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ol>
    .replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
      // Count if we have numbered items or bullets
      return `<ol>${match}</ol>`;
    })
    // Paragraphs: double newline -> </p><p>
    .replace(/\n\n/g, '</p><p>')
    // Wrap in paragraph tags
    .replace(/^(.+)$/gm, (match) => {
      if (match.includes('<ol>') || match.includes('</ol>') || match.includes('<li>')) {
        return match;
      }
      return match;
    })
    // Single line break -> <br>
    .replace(/\n/g, '<br>');
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: Array<{ label: string; action: string; icon?: string }>;
  feedback?: 'positive' | 'negative';
  language?: string;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (route: string) => void;
  userContext: {
    userId: string;
    userName: string;
    userRole: 'USER' | 'BUSINESS' | 'CREATOR';
    location?: { city?: string; country?: string };
    currentScreen?: string;
    subscriptionLevel?: string;
    businessType?: string;
  };
}

export const EnhancedAIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  userContext
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<string>('en');
  const [contextData, setContextData] = useState<UserContextData | null>(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const chatCacheKey = `ai_chat_enhanced_${userContext.userId}`;

  // Load enhanced context on mount
  useEffect(() => {
    if (isOpen) {
      loadEnhancedContext();
    }
  }, [isOpen]);

  // Load conversation history from Firestore
  useEffect(() => {
    if (isOpen && userContext.userId) {
      loadConversationHistory();
    }
  }, [isOpen, userContext.userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Setup speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = language === 'es' ? 'es-ES' : 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [language]);

  /**
   * Load enhanced user context with real-time data
   */
  const loadEnhancedContext = async () => {
    try {
      const context = await fetchUserContext(userContext.userId, userContext.userRole);
      setContextData(context);
      console.log('[AI Assistant] Enhanced context loaded:', context);
      console.log('[AI Assistant] Subscription Limits:', context.subscriptionLimits);
      console.log('[AI Assistant] Tier:', context.subscriptionTier);
      console.log('[AI Assistant] Level:', context.businessLevel);
    } catch (error) {
      console.error('[AI Assistant] Error loading context:', error);
    }
  };

  /**
   * Load conversation history from Firestore
   */
  const loadConversationHistory = async () => {
    try {
      const conversationsRef = collection(db, 'aiConversations');
      const q = query(
        conversationsRef,
        where('userId', '==', userContext.userId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const history: Message[] = [];
      
      snapshot.docs.reverse().forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.timestamp?.toDate() || new Date(),
          actions: data.actions,
          feedback: data.feedback
        });
      });
      
      if (history.length > 0) {
        setMessages(history);
        console.log('[AI Assistant] Loaded', history.length, 'messages from history');
      } else {
        // Show welcome message
        showWelcomeMessage();
      }
    } catch (error) {
      console.error('[AI Assistant] Error loading history:', error);
      showWelcomeMessage();
    }
  };

  /**
   * Show personalized welcome message
   */
  const showWelcomeMessage = () => {
    const stats = contextData?.stats;
    let welcomeText = `Hi ${userContext.userName}! 👋 I'm your enhanced Beevvy AI Assistant.\n\n`;
    
    if (userContext.userRole === 'BUSINESS' && stats) {
      welcomeText += `📊 Quick Stats:\n`;
      welcomeText += `• ${stats.activeMissions || 0} active campaigns\n`;
      welcomeText += `• ${stats.pendingReviews || 0} pending reviews\n`;
      welcomeText += `• ${stats.activeAmbassadors || 0} active ambassadors\n\n`;
    } else if (userContext.userRole === 'CREATOR' && stats) {
      welcomeText += `📊 Your Progress:\n`;
      welcomeText += `• ${stats.activeProjects || 0} active projects\n`;
      welcomeText += `• ${stats.projectApplications || 0} applications\n\n`;
    } else if (stats) {
      welcomeText += `🎯 Your Progress:\n`;
      welcomeText += `• Level ${stats.level || 1}\n`;
      welcomeText += `• ${stats.totalPoints || 0} points\n`;
      welcomeText += `• ${stats.missionsCompleted || 0} missions completed\n\n`;
    }
    
    welcomeText += `What can I help you with today?`;
    
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: welcomeText,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  };

  /**
   * Save conversation to Firestore
   */
  const saveToFirestore = async (message: Message) => {
    try {
      const data: any = {
        userId: userContext.userId,
        role: message.role,
        content: message.content,
        timestamp: Timestamp.fromDate(message.timestamp),
        language
      };
      
      // Only include optional fields if they have values
      if (message.actions && message.actions.length > 0) {
        data.actions = message.actions;
      }
      if (message.feedback) {
        data.feedback = message.feedback;
      }
      
      await addDoc(collection(db, 'aiConversations'), data);
    } catch (error) {
      console.error('[AI Assistant] Error saving message:', error);
    }
  };

  /**
   * Send message with enhanced context
   */
  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');
    
    // Save user message
    saveToFirestore(userMessage);

    try {
      // Prepare enhanced chat history with context
      const chatHistory = messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }));

      chatHistory.push({
        role: 'user' as const,
        content: textToSend
      });

      // Get upgrade recommendations if applicable
      const { getUpgradeRecommendations } = await import('../services/aiContextService');
      const upgradeRec = contextData ? getUpgradeRecommendations(contextData) : null;

      // Add context data to the conversation
      const enhancedContext = {
        ...userContext,
        stats: contextData?.stats,
        recentActivity: contextData?.recentActivity?.map(a => `${a.type}: ${a.title}`),
        businessLevel: contextData?.businessLevel,
        subscriptionTier: contextData?.subscriptionTier,
        subscriptionLimits: contextData?.subscriptionLimits,
        upgradeRecommendation: upgradeRec || undefined,
        language
      };

      console.log('[AI Assistant] Sending context to OpenAI:', enhancedContext);
      console.log('[AI Assistant] Subscription Limits being sent:', enhancedContext.subscriptionLimits);

      // Stream response
      let fullResponse = '';
      
      const response = await chatWithAssistant(
        chatHistory,
        enhancedContext,
        (chunk) => {
          fullResponse += chunk;
          setStreamingMessage(fullResponse);
        }
      );

      // Parse response for action buttons
      const actions = extractActions(response, contextData);

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        actions
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessage('');
      
      // Save assistant message
      saveToFirestore(assistantMessage);

      // Speak response if enabled
      if (language !== 'en') {
        speakText(response);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setStreamingMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Extract actionable buttons from AI response
   */
  const extractActions = (response: string, context: UserContextData | null): Array<{ label: string; action: string; icon?: string }> => {
    const actions: Array<{ label: string; action: string; icon?: string }> = [];
    
    // Check for navigation suggestions in response
    if (response.includes('create') && response.includes('mission')) {
      actions.push({ label: 'Create Mission', action: 'navigate:/missions/create', icon: '🎯' });
    }
    
    if (response.includes('analytics') || response.includes('performance')) {
      actions.push({ label: 'View Analytics', action: 'navigate:/analytics', icon: '📊' });
    }
    
    if (response.includes('review') && response.includes('pending')) {
      actions.push({ label: 'Review Submissions', action: 'navigate:/missions/verify', icon: '⏱️' });
    }
    
    if (response.includes('profile') && context?.userRole === 'CREATOR') {
      actions.push({ label: 'Edit Portfolio', action: 'navigate:/portfolio', icon: '🎨' });
    }
    
    if (response.includes('explore') || response.includes('discover')) {
      actions.push({ label: 'Explore Missions', action: 'navigate:/explore', icon: '🗺️' });
    }
    
    return actions;
  };

  /**
   * Handle action button click
   */
  const handleActionClick = (action: string) => {
    if (action.startsWith('navigate:')) {
      const route = action.replace('navigate:', '');
      onNavigate?.(route);
      onClose();
    }
  };

  /**
   * Copy message content
   */
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // Show toast notification
  };

  /**
   * Provide feedback on message
   */
  const provideFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
    
    // Save feedback to Firestore
    if (conversationId) {
      try {
        const conversationRef = doc(db, 'aiConversations', conversationId);
        const conversationDoc = await getDoc(conversationRef);
        
        if (conversationDoc.exists()) {
          const messages = conversationDoc.data().messages || [];
          const updatedMessages = messages.map((msg: any) => 
            msg.id === messageId ? { ...msg, feedback, feedbackAt: new Date() } : msg
          );
          
          await updateDoc(conversationRef, {
            messages: updatedMessages,
            updatedAt: Timestamp.now()
          });
        }
      } catch (error) {
        console.error('[AIAssistant] Error saving feedback:', error);
      }
    }
  };

  /**
   * Start voice input
   */
  const startVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  /**
   * Speak text aloud
   */
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  /**
   * Change language
   */
  const changeLanguage = (newLang: string) => {
    setLanguage(newLang);
    setShowLanguageMenu(false);
    // Translate existing messages if needed
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const contextualActions = contextData ? getContextualActions(contextData) : [];
  const quickSuggestions = getQuickSuggestions(userContext.userRole);

  return (
    <div className="ai-assistant-overlay" onClick={onClose}>
      <div 
        className={`ai-assistant-modal ${isMinimized ? 'minimized' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ai-assistant-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="ai-assistant-icon-pulse">
              <Bot size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Enhanced AI Assistant</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                {contextData?.stats ? '📊 Context-Aware' : '🤖'} • {language.toUpperCase()} • 24/7 Support
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="ai-header-button"
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              title="Change Language"
            >
              <Globe size={18} />
            </button>
            <button 
              className="ai-header-button"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
            <button className="ai-assistant-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Language Menu */}
        {showLanguageMenu && (
          <div className="ai-language-menu">
            <button onClick={() => changeLanguage('en')}>🇺🇸 English</button>
            <button onClick={() => changeLanguage('es')}>🇪🇸 Español</button>
            <button onClick={() => changeLanguage('fr')}>🇫🇷 Français</button>
            <button onClick={() => changeLanguage('de')}>🇩🇪 Deutsch</button>
          </div>
        )}

        {!isMinimized && (
          <>
            {/* Quick Context Actions */}
            {contextualActions.length > 0 && (
              <div className="ai-context-actions">
                <p className="ai-context-label">Quick Actions:</p>
                <div className="ai-action-buttons">
                  {contextualActions.slice(0, 3).map((action, index) => (
                    <button
                      key={index}
                      className="ai-action-button"
                      onClick={() => handleActionClick(action.action)}
                    >
                      <span>{action.icon}</span>
                      {action.label}
                      <ArrowRight size={14} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="ai-assistant-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`ai-message ${message.role === 'user' ? 'ai-message-user' : 'ai-message-assistant'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="ai-message-icon">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className="ai-message-content-wrapper">
                    <div 
                      className="ai-message-content"
                      dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                    />
                    
                    {/* Action Buttons */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="ai-message-actions">
                        {message.actions.map((action, idx) => (
                          <button
                            key={idx}
                            className="ai-inline-action"
                            onClick={() => handleActionClick(action.action)}
                          >
                            {action.icon} {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Message Controls */}
                    {message.role === 'assistant' && (
                      <div className="ai-message-controls">
                        <button
                          className="ai-control-button"
                          onClick={() => copyToClipboard(message.content)}
                          title="Copy"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          className="ai-control-button"
                          onClick={() => speakText(message.content)}
                          title="Read Aloud"
                        >
                          <Volume2 size={12} />
                        </button>
                        <button
                          className={`ai-control-button ${message.feedback === 'positive' ? 'active' : ''}`}
                          onClick={() => provideFeedback(message.id, 'positive')}
                          title="Helpful"
                        >
                          <ThumbsUp size={12} />
                        </button>
                        <button
                          className={`ai-control-button ${message.feedback === 'negative' ? 'active' : ''}`}
                          onClick={() => provideFeedback(message.id, 'negative')}
                          title="Not Helpful"
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="ai-message-avatar">
                      {userContext.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming message */}
              {streamingMessage && (
                <div className="ai-message ai-message-assistant">
                  <div className="ai-message-icon">
                    <Bot size={16} />
                  </div>
                  <div className="ai-message-content">
                    {streamingMessage}
                    <span className="ai-typing-cursor">▋</span>
                  </div>
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && !streamingMessage && (
                <div className="ai-message ai-message-assistant">
                  <div className="ai-message-icon">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div className="ai-message-content" style={{ color: '#6b7280' }}>
                    {contextData ? 'Analyzing your data...' : 'Thinking...'}
                  </div>
                </div>
              )}

              {/* Quick suggestions */}
              {messages.length <= 1 && !isLoading && (
                <div className="ai-suggestions">
                  <p className="ai-suggestions-label">Quick questions:</p>
                  {quickSuggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      className="ai-suggestion-chip"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Sparkles size={14} />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="ai-assistant-input-container">
              <button
                className={`ai-voice-button ${isListening ? 'listening' : ''}`}
                onClick={startVoiceInput}
                disabled={isLoading || !recognitionRef.current}
                title="Voice Input"
              >
                <Mic size={18} />
              </button>
              <input
                ref={inputRef}
                type="text"
                className="ai-assistant-input"
                placeholder={isListening ? 'Listening...' : 'Ask me anything...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || isListening}
              />
              <button
                className="ai-assistant-send"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
              >
                <Send size={20} />
              </button>
            </div>

            {/* Footer */}
            <div className="ai-assistant-footer">
              <Sparkles size={12} />
              <span>Enhanced AI • Context-Aware • Multi-Language • Voice-Enabled</span>
            </div>
          </>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="ai-minimized-content">
            <Bot size={32} className="ai-pulse" />
            <p>AI Assistant Ready</p>
          </div>
        )}
      </div>
    </div>
  );
};
