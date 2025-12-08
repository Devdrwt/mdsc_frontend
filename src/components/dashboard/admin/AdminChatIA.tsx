'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Shield, BarChart3, Users, Settings, Server, AlertTriangle } from 'lucide-react';
import { chatIAService, ChatMessage, ChatContext } from '../../../lib/services/chatIAService';
import { useAuthStore } from '../../../lib/stores/authStore';
import ReactMarkdown from 'react-markdown';

interface AdminChatIAProps {
  courseId?: string;
  moduleId?: string;
}

export default function AdminChatIA({ courseId, moduleId }: AdminChatIAProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context: ChatContext = {
    userId: user?.id?.toString() || '',
    userRole: 'admin',
    courseId,
    moduleId,
  };

  useEffect(() => {
    // Message de bienvenue pour administrateurs
    const adminName = user?.firstName || user?.lastName || 'Administrateur';
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Bonjour ${adminName} ! 👑 Je suis votre assistant IA administrateur de la Maison de la Société Civile. Je peux vous aider à gérer la plateforme Maison de la Société Civile, analyser les données système, surveiller les performances, modérer le contenu des formations et optimiser les ressources. Je suis spécialisé dans les sujets concernant Maison de la Société Civile et ses formations. Comment puis-je vous aider aujourd'hui ?`,
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
      icon: BarChart3,
      label: 'Analyser la plateforme',
      action: () => setInputMessage('Analyse la santé du système et les performances globales de la plateforme'),
    },
    {
      icon: Users,
      label: 'Gérer les utilisateurs',
      action: () => setInputMessage('Liste les utilisateurs actifs et génère un rapport de modération'),
    },
    {
      icon: Server,
      label: 'Surveiller le système',
      action: () => setInputMessage('Montre les métriques système et les alertes récentes'),
    },
    {
      icon: Settings,
      label: 'Optimiser les ressources',
      action: () => setInputMessage('Recommandations pour améliorer les performances et l\'expérience utilisateur'),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      {/* En-tête */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Bot className="h-6 w-6 text-mdsc-blue-primary dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Assistant IA Admin</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Votre compagnon administratif intelligent</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-mdsc-blue-primary dark:text-blue-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">GPT-4 Mini</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-800/50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-xs lg:max-w-md xl:max-w-lg ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`p-2 rounded-lg flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-mdsc-blue-primary text-white'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-gray-900 dark:text-white'
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
                    ? 'bg-mdsc-blue-primary text-white'
                    : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-700'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-sm mb-2 last:mb-0 text-gray-900 dark:text-gray-100">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                        em: ({ children }) => <em className="italic text-gray-800 dark:text-gray-200">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-sm text-gray-900 dark:text-gray-100">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-sm text-gray-900 dark:text-gray-100">{children}</ol>,
                        li: ({ children }) => <li className="text-sm text-gray-900 dark:text-gray-100">{children}</li>,
                        code: ({ children }) => (
                          <code className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-mdsc-blue-primary dark:border-blue-400 pl-3 italic text-gray-700 dark:text-gray-300 mb-2">
                            {children}
                          </blockquote>
                        ),
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">{children}</h3>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
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
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Actions rapides */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Actions rapides pour administrateurs :</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question administrative..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}

