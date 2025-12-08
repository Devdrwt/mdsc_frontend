'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, BookOpen, Lightbulb, Target, Users, BarChart3, Award } from 'lucide-react';
import { chatIAService, ChatMessage, ChatContext } from '../../../lib/services/chatIAService';
import { useAuthStore } from '../../../lib/stores/authStore';

interface InstructorChatIAProps {
  courseId?: string;
  moduleId?: string;
}

export default function InstructorChatIA({ courseId, moduleId }: InstructorChatIAProps) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context: ChatContext = {
    userId: user?.id?.toString() || '',
    userRole: 'instructor',
    courseId,
    moduleId,
  };

  useEffect(() => {
    // Message de bienvenue pour formateurs
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Bonjour ${user?.firstName} ! 👨‍🏫 Je suis votre assistant IA pour formateurs de la Maison de la Société Civile. Je peux vous aider à créer du contenu pédagogique pour vos formations Maison de la Société Civile, analyser les performances de vos utilisateurs, suggérer des améliorations de cours et répondre à vos questions d'enseignement sur la plateforme. Je suis spécialisé dans les sujets concernant Maison de la Société Civile et ses formations. Comment puis-je vous aider aujourd'hui ?`,
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
      label: 'Créer un cours',
      action: () => setInputMessage('Peux-tu m\'aider à créer un nouveau cours sur...'),
    },
    {
      icon: Users,
      label: 'Analyser les utilisateurs',
      action: () => setInputMessage('Comment puis-je améliorer l\'engagement de mes utilisateurs ?'),
    },
    {
      icon: BarChart3,
      label: 'Optimiser les cours',
      action: () => setInputMessage('Quelles sont les meilleures pratiques pour optimiser mes cours ?'),
    },
    {
      icon: Award,
      label: 'Système d\'évaluation',
      action: () => setInputMessage('Comment créer un système d\'évaluation efficace ?'),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200">
      {/* En-tête */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Bot className="h-6 w-6 text-mdsc-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Assistant IA Formateur</h3>
            <p className="text-sm text-gray-500">Votre compagnon pédagogique intelligent</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-mdsc-gold" />
          <span className="text-sm text-gray-500">GPT-4 Mini</span>
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
                    ? 'bg-mdsc-gold text-white'
                    : 'bg-orange-300/20 text-gray-900'
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
                    ? 'bg-mdsc-gold text-white'
                    : 'bg-orange-300/20 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-yellow-100' : 'text-gray-500'
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
              <div className="p-2 rounded-lg bg-orange-300/20">
                <Bot className="h-4 w-4 text-gray-600" />
              </div>
              <div className="px-4 py-2 rounded-lg bg-orange-300/20">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Actions rapides */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Actions rapides pour formateurs :</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-300/20 hover:bg-orange-100 rounded-lg text-sm text-gray-700 transition-colors"
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zone de saisie */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question pédagogique..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-mdsc-gold focus:border-transparent"
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-mdsc-gold text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}
