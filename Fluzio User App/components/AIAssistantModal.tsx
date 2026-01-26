/**
 * AI Assistant Modal - 24/7 Intelligent Support
 * Context-aware chatbot that helps users with questions, troubleshooting, and guidance
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { chatWithAssistant, getQuickSuggestions } from '../services/openaiService';
import './AIAssistantModal.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  userContext
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickSuggestions = getQuickSuggestions(userContext.userRole);
  const chatCacheKey = `ai_chat_${userContext.userId}`;

  // Load chat history from cache on mount
  useEffect(() => {
    const cached = localStorage.getItem(chatCacheKey);
    if (cached) {
      try {
        const cachedMessages = JSON.parse(cached);
        // Only load if less than 24 hours old
        if (cachedMessages.length > 0) {
          const lastMessageTime = new Date(cachedMessages[cachedMessages.length - 1].timestamp).getTime();
          const age = Date.now() - lastMessageTime;
          if (age < 24 * 60 * 60 * 1000) { // 24 hours
            setMessages(cachedMessages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            })));
            console.log('[AIChat] Loaded', cachedMessages.length, 'messages from cache');
            return;
          }
        }
      } catch (e) {
        console.warn('[AIChat] Invalid cache');
      }
    }
  }, []);

  // Save messages to cache whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(chatCacheKey, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // Welcome message on first open
      if (messages.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: `Hi ${userContext.userName}! 👋 I'm your Beevvy AI Assistant. I'm here to help you with any questions about the platform. What can I help you with today?`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [isOpen]);

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

    try {
      // Prepare chat history for API
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Add current user message
      chatHistory.push({
        role: 'user' as const,
        content: textToSend
      });

      // Stream response
      let fullResponse = '';
      
      const response = await chatWithAssistant(
        chatHistory,
        userContext,
        (chunk) => {
          fullResponse += chunk;
          setStreamingMessage(fullResponse);
        }
      );

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessage('');

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Show error message
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-overlay" onClick={onClose}>
      <div className="ai-assistant-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-assistant-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="ai-assistant-icon">
              <Bot size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>AI Assistant</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                24/7 Support • Powered by AI
              </p>
            </div>
          </div>
          <button className="ai-assistant-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

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
              <div className="ai-message-content">
                {message.content}
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
                Thinking...
              </div>
            </div>
          )}

          {/* Quick suggestions (show when no messages yet) */}
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
          <input
            ref={inputRef}
            type="text"
            className="ai-assistant-input"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
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
          <span>AI can make mistakes. Verify important information.</span>
        </div>
      </div>
    </div>
  );
};
