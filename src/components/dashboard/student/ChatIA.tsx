'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, BookOpen, Lightbulb, Target } from 'lucide-react';
import { chatIAService, ChatMessage, ChatContext } from '../../../lib/services/chatIAService';
import { useAuthStore } from '../../../lib/stores/authStore';

interface ChatIAProps {
  courseId?: string;
  moduleId?: string;
}

export default function ChatIA({ courseId, moduleId }: ChatIAProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context: ChatContext = {
    userId: user?.id?.toString() || '',
    userRole: 'student',
    courseId,
    moduleId,
  };

  useEffect(() => {
    // Message de bienvenue
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Bonjour ${user?.firstName} ! Je suis votre assistant IA personnel. Je peux vous aider avec vos cours, répondre à vos questions, générer des résumés et vous recommander du contenu. Comment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date(),
      context,
    };
    setMessages([welcomeMessage]);
  }, [user, courseId, moduleId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      context,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await chatIAService.sendMessage(inputMessage, context);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.',
        timestamp: new Date(),
        context,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    {
      icon: BookOpen,
      label: 'Résumer ce cours',
      action: () => setInputMessage('Peux-tu me faire un résumé de ce cours ?'),
    },
    {
      icon: Lightbulb,
      label: 'Concepts clés',
      action: () => setInputMessage('Quels sont les concepts clés de ce module ?'),
    },
    {
      icon: Target,
      label: 'Recommandations',
      action: () => setInputMessage('Peux-tu me recommander des cours similaires ?'),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white backdrop-blur-md  dark:bg-white rounded-lg shadow-sm  border border-gray-200 dark:border-mdsc-blue-dark">
      {/* En-tête */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-mdsc-blue-dark">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">  
            <Bot className="h-6 w-6 text-orange-300" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-black">Assistant IA</h3>
            <p className="text-sm text-gray-900 dark:text-black">Votre compagnon d'apprentissage</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-orange-500 " />
          <span className="text-sm text-gray-900 dark:text-black">GPT-3.5</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-mdsc-blue-dark text-white'
                    : 'bg-gray-100 dark:bg-mdsc-blue-dark text-gray-900 dark:text-white'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-mdsc-blue-dark text-white'
                    : 'bg-gray-100 dark:bg-mdsc-blue-dark text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-200'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Indicateur de frappe */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-mdsc-blue-dark">
                <Bot className="h-4 w-4 text-gray-600 dark:text-white" />
              </div>
              <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-mdsc-blue-dark">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Actions rapides */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-mdsc-blue-dark">
          <p className="text-sm text-gray-600 dark:text-gray-200 mb-3">Actions rapides :</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-mdsc-blue-dark hover:bg-gray-200 dark:hover:bg-mdsc-blue-dark rounded-lg text-sm text-gray-700 dark:text-white transition-colors"
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200 dark:border-mdsc-blue-dark">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-mdsc-blue-dark rounded-lg resize-none 
                         focus:outline-none focus:ring-1 focus:ring-mdsc-blue-primary focus:border-transparent
                         bg-white/20 text-white font-bold "
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}
