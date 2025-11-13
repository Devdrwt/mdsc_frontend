'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import { useAuthStore } from '../../../../lib/stores/authStore';
import MessageService, {
  MessageEntry,
  PaginatedMessages,
} from '../../../../lib/services/messageService';
import {
  Inbox,
  Send,
  Loader2,
  Trash2,
  MailOpen,
  Mail,
  RefreshCw,
  Search,
  AlertCircle,
  Plus,
} from 'lucide-react';
import MessageComposer from '../../../../components/messages/MessageComposer';

interface TabConfig {
  key: 'inbox' | 'sent' | 'compose';
  label: string;
  description: string;
  icon: React.ComponentType<any>;
}

const tabs: TabConfig[] = [
  {
    key: 'inbox',
    label: 'Messages reçus',
    description: 'Tous les messages reçus via la plateforme',
    icon: Inbox,
  },
  {
    key: 'sent',
    label: 'Messages envoyés',
    description: 'Historique des messages envoyés',
    icon: Send,
  },
  {
    key: 'compose',
    label: 'Nouveau message',
    description: 'Composer et envoyer un nouveau message',
    icon: Plus,
  },
];

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function StudentMessagesPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [pagination, setPagination] = useState<PaginatedMessages['pagination']>();
  const [selectedMessage, setSelectedMessage] = useState<MessageEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async (tab: 'inbox' | 'sent' | 'compose', query = '', page = 1) => {
    if (tab === 'compose') return; // Ne pas charger les messages en mode composition
    try {
      setLoading(true);
      setError(null);

      let response: PaginatedMessages;
      if (query.trim()) {
        response = await MessageService.search(query, { page, limit: 20 });
      } else if (tab === 'sent') {
        response = await MessageService.getSentMessages({ page, limit: 20 });
      } else {
        response = await MessageService.getReceivedMessages({ page, limit: 20 });
      }

      setMessages(response.messages ?? []);
      setPagination(response.pagination);

      if (selectedMessage) {
        const updatedSelected = response.messages?.find((msg) => msg.id === selectedMessage.id);
        setSelectedMessage(updatedSelected ?? null);
      }
    } catch (err: any) {
      console.error('Erreur chargement messages:', err);
      setError(err?.message ?? 'Impossible de charger les messages');
      setMessages([]);
      setPagination(undefined);
      setSelectedMessage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (activeTab !== 'compose') {
      loadMessages(activeTab);
    }
  }, [user, activeTab]);

  const handleComposerSend = () => {
    loadMessages('sent');
    setActiveTab('sent');
    setSelectedMessage(null);
  };

  const handleSelectMessage = async (message: MessageEntry) => {
    // Afficher immédiatement le message pour une meilleure UX
    setSelectedMessage(message);
    
    // Si le message n'est pas lu, marquer comme lu (et la notification associée)
    if (!message.is_read && activeTab === 'inbox' && message.id) {
      try {
        // markAsRead marque automatiquement la notification associée comme lue côté backend
        await MessageService.markAsRead(message.id);
        setMessages((prev) =>
          prev.map((msg) => (msg.id === message.id ? { ...msg, is_read: true } : msg))
        );
        setSelectedMessage({ ...message, is_read: true });
      } catch (err: any) {
        // Ignorer silencieusement les erreurs 404 (message non trouvé) - peut arriver si le message a été supprimé
        if (err?.status !== 404) {
          console.error('Erreur lors du marquage du message comme lu:', err);
        }
        // Continuer à afficher le message même en cas d'erreur
      }
    }
  };

  const handleDelete = async (messageId: string | number) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    try {
      setActionLoading(true);
      await MessageService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      alert(err?.message ?? 'Impossible de supprimer ce message.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderState = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-mdsc-blue-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-red-700 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <div>
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => loadMessages(activeTab, searchQuery)}
              className="mt-2 inline-flex items-center space-x-2 text-sm text-red-700 hover:text-red-900"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchQuery ? 'Aucun message ne correspond à votre recherche' : 'Aucun message pour le moment'}
          </p>
        </div>
      );
    }

    return null;
  };

  const headerDescription = useMemo(() => {
    const tabConfig = tabs.find((tab) => tab.key === activeTab);
    return tabConfig?.description;
  }, [activeTab]);

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
                <p className="text-sm text-gray-600">{headerDescription}</p>
              </div>
              {activeTab !== 'compose' && (
                <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
                  <Search className="h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un message..."
                    className="bg-transparent focus:outline-none text-sm"
                  />
                  <button
                    className="text-xs text-mdsc-blue-primary hover:text-mdsc-blue-dark transition"
                    onClick={() => loadMessages(activeTab, searchQuery)}
                  >
                    Rechercher
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key !== 'compose') {
                      setSelectedMessage(null);
                    }
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                    activeTab === tab.key
                      ? 'border-mdsc-blue-primary bg-blue-50 text-mdsc-blue-primary'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  } transition`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab === 'compose' ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <MessageComposer 
                  onSend={handleComposerSend} 
                  onCancel={() => setActiveTab('inbox')} 
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y">
                    {renderState()}
                    {!loading && !error && messages.length > 0 && (
                      messages.map((message) => (
                        <button
                          key={message.id}
                          onClick={() => handleSelectMessage(message)}
                          className={`w-full text-left px-4 py-3 flex flex-col space-y-1 transition ${
                            selectedMessage?.id === message.id ? 'bg-white' : 'hover:bg-white'
                          } ${!message.is_read && activeTab === 'inbox' ? 'border-l-4 border-mdsc-blue-primary bg-blue-50/70' : ''}`}
                        >
              <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900">
                              {activeTab === 'sent' 
                                ? (message.recipient?.name || message.recipient?.email || 'Destinataire inconnu')
                                : (message.sender?.name || message.sender?.email || 'Expéditeur inconnu')}
                            </span>
                            <span className="text-xs text-gray-400">{formatDateTime(message.created_at)}</span>
                          </div>
                          <span className="text-sm text-gray-700 line-clamp-1">{message.subject || '(Sans objet)'}</span>
                          <span className="text-xs text-gray-500 line-clamp-1">{message.content}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  {selectedMessage ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                    <div className="flex items-start justify-between">
              <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedMessage.subject || '(Sans objet)'}</h2>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>
                            <span className="font-medium text-gray-700">De :</span>{' '}
                            {selectedMessage.sender?.name || selectedMessage.sender?.email || 'Expéditeur inconnu'}
                          </p>
                          <p>{formatDateTime(selectedMessage.created_at)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(selectedMessage.id)}
                        disabled={actionLoading}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-700 whitespace-pre-line">
                      {selectedMessage.content}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col items-center justify-center py-12 text-center text-gray-500">
                    <MailOpen className="h-12 w-12 text-gray-300 mb-3" />
                    <p>Sélectionnez un message pour l’afficher.</p>
                  </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
