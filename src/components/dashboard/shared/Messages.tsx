'use client';

import React, { useState, useEffect } from 'react';
import { Inbox, Send, Plus, Search, Mail, MailOpen, Trash2, Clock, User, Users } from 'lucide-react';
import { MessageService, Message } from '../../../lib/services/messageService';
import { useAuthStore } from '../../../lib/stores/authStore';
import toast from '../../../lib/utils/toast';

interface MessagesProps {
  courseId?: string;
}

export default function Messages({ courseId }: MessagesProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose' | 'course'>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [composeData, setComposeData] = useState({
    receiverId: '',
    subject: '',
    content: '',
  });

  useEffect(() => {
    loadMessages();
  }, [activeTab, courseId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      let data: Message[] = [];
      if (activeTab === 'inbox') {
        data = await MessageService.getReceivedMessages();
      } else if (activeTab === 'sent') {
        data = await MessageService.getSentMessages();
      } else if (activeTab === 'course' && courseId) {
        data = await MessageService.getCourseMessages(courseId);
      }
      // S'assurer que data est toujours un tableau
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]); // En cas d'erreur, initialiser avec un tableau vide
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier si c'est un message de broadcast
    if (activeTab === 'course' && courseId) {
      if (!composeData.subject || !composeData.content) {
        toast.warning('Formulaire incomplet', 'Veuillez remplir tous les champs');
        return;
      }

      try {
        await MessageService.sendBroadcastMessage({
          courseId,
          subject: composeData.subject,
          content: composeData.content,
          type: 'broadcast',
        });
        toast.success('Message envoyé', 'Message envoyé avec succès à tous les participants du cours');
        setComposeData({ receiverId: '', subject: '', content: '' });
        setActiveTab('course');
        loadMessages();
      } catch (error: any) {
        console.error('Error sending broadcast message:', error);
        toast.error('Erreur', error.message || 'Erreur lors de l\'envoi du message');
      }
      return;
    }

    // Message direct
    if (!composeData.receiverId || !composeData.subject || !composeData.content) {
      toast.warning('Formulaire incomplet', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      await MessageService.sendMessage({
        receiverId: parseInt(composeData.receiverId),
        subject: composeData.subject,
        content: composeData.content,
      });
      toast.success('Message envoyé', 'Votre message a été envoyé avec succès');
      setComposeData({ receiverId: '', subject: '', content: '' });
      setActiveTab('inbox');
      loadMessages();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Erreur', error.message || 'Erreur lors de l\'envoi du message');
    }
  };

  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      await MessageService.markAsRead(message.id);
      message.isRead = true;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;

    try {
      await MessageService.deleteMessage(messageId);
      setMessages(messages.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
      toast.success('Message supprimé', 'Le message a été supprimé avec succès');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Erreur', 'Erreur lors de la suppression');
    }
  };

  const filteredMessages = Array.isArray(messages) ? messages.filter(message => {
    const searchLower = searchTerm.toLowerCase();
    return (
      message.subject.toLowerCase().includes(searchLower) ||
      message.content.toLowerCase().includes(searchLower) ||
      (activeTab === 'inbox' ? message.senderName : message.receiverName).toLowerCase().includes(searchLower)
    );
  }) : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 px-4 py-4 text-center font-medium transition-colors ${
              activeTab === 'inbox'
                ? 'text-mdsc-blue-primary border-b-2 border-mdsc-blue-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Inbox className="h-5 w-5 inline-block mr-2" />
            Boîte de réception
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 px-4 py-4 text-center font-medium transition-colors ${
              activeTab === 'sent'
                ? 'text-mdsc-blue-primary border-b-2 border-mdsc-blue-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Send className="h-5 w-5 inline-block mr-2" />
            Envoyés
          </button>
          {courseId && (
            <button
              onClick={() => setActiveTab('course')}
              className={`flex-1 px-4 py-4 text-center font-medium transition-colors ${
                activeTab === 'course'
                  ? 'text-mdsc-blue-primary border-b-2 border-mdsc-blue-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="h-5 w-5 inline-block mr-2" />
              Messages du cours
            </button>
          )}
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex-1 px-4 py-4 text-center font-medium transition-colors ${
              activeTab === 'compose'
                ? 'text-mdsc-blue-primary border-b-2 border-mdsc-blue-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="h-5 w-5 inline-block mr-2" />
            Nouveau message
          </button>
        </div>

        {activeTab !== 'compose' && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
          {activeTab !== 'compose' && (
            <div className="border-r border-gray-200 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Chargement...</div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {activeTab === 'course' ? 'Aucun message dans ce cours' : activeTab === 'inbox' ? 'Aucun message reçu' : 'Aucun message envoyé'}
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleOpenMessage(message)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !message.isRead && activeTab === 'inbox' ? 'bg-blue-50' : ''
                    } ${selectedMessage?.id === message.id ? 'bg-mdsc-blue-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {!message.isRead && activeTab === 'inbox' && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                        <span className="font-medium text-gray-900 truncate">
                          {activeTab === 'inbox' ? message.senderName : activeTab === 'course' ? message.senderName : message.receiverName}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 mb-1 truncate">{message.subject}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          <div className={`${activeTab === 'compose' ? 'lg:col-span-3' : 'lg:col-span-2'} overflow-y-auto p-6`}>
            {activeTab === 'compose' ? (
              <form onSubmit={handleSendMessage} className="space-y-6">
                {courseId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">
                        Vous allez envoyer un message à tous les participants de ce cours
                      </span>
                    </div>
                  </div>
                )}
                {!courseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destinataire (ID utilisateur) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={composeData.receiverId}
                    onChange={(e) => setComposeData({ ...composeData, receiverId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    placeholder="Entrez l'ID de l'utilisateur"
                      required={!courseId}
                  />
                </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={composeData.subject}
                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    placeholder="Objet du message"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={composeData.content}
                    onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    placeholder={courseId ? 'Votre message sera envoyé à tous les participants du cours...' : 'Votre message...'}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setComposeData({ receiverId: '', subject: '', content: '' })}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            ) : selectedMessage ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {activeTab === 'inbox' ? selectedMessage.senderName : activeTab === 'course' ? selectedMessage.senderName : selectedMessage.receiverName}
                      </span>
                      {selectedMessage.type === 'broadcast' && (
                        <span className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Broadcast
                      </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Mail className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p>Sélectionnez un message pour le lire</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
