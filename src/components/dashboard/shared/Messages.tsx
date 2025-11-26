'use client';

import React, { useState, useEffect } from 'react';
import { Inbox, Send, Plus, Search, Mail, MailOpen, Trash2, Clock, User, Users, RefreshCw } from 'lucide-react';
import { MessageService, MessageEntry, PaginatedMessages, UserInfo } from '../../../lib/services/messageService';
import { useAuthStore } from '../../../lib/stores/authStore';
import MessageComposer from '../../messages/MessageComposer';
import toast from '../../../lib/utils/toast';
import ConfirmModal from '../../ui/ConfirmModal';

interface MessagesProps {
  courseId?: string;
}

export default function Messages({ courseId }: MessagesProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose' | 'course'>('inbox');
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [composeData, setComposeData] = useState({
    receiverEmail: '',
    subject: '',
    content: '',
  });

  // Charger les messages
  useEffect(() => {
    loadMessages();
  }, [activeTab, courseId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      let response: PaginatedMessages | null = null;

      if (activeTab === 'inbox') {
        response = await MessageService.getReceivedMessages({ limit: 100 });
      } else if (activeTab === 'sent') {
        response = await MessageService.getSentMessages({ limit: 100 });
      } else if (activeTab === 'course' && courseId) {
        response = await MessageService.getCourseMessages(courseId, { limit: 100 });
      }

      setMessages(response?.messages ?? []);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
      toast.error('Erreur', 'Impossible de charger les messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Envoi broadcast
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'course' && courseId) {
      if (!composeData.subject || !composeData.content) {
        toast.warning('Champs requis', 'Veuillez remplir l’objet et le contenu');
        return;
      }

      try {
        await MessageService.sendBroadcastMessage({
          courseId,
          subject: composeData.subject,
          content: composeData.content,
          type: 'broadcast',
        });
        toast.success('Envoyé', 'Message diffusé à tous les participants');
        setComposeData({ receiverEmail: '', subject: '', content: '' });
        setActiveTab('course');
        loadMessages();
      } catch (error: any) {
        toast.error('Échec', error.message || "Erreur d'envoi");
      }
    }
  };

  const handleComposerSend = () => {
    loadMessages();
    setActiveTab('inbox');
  };

  // Ouvrir + marquer lu (markAsRead marque automatiquement la notification comme lue côté backend)
  const handleOpenMessage = async (message: MessageEntry) => {
    // Afficher immédiatement le message pour une meilleure UX
    setSelectedMessage(message);
    
    // Si le message n'est pas lu, marquer comme lu (et la notification associée)
    if (!message.is_read && activeTab === 'inbox' && message.id) {
      try {
        // markAsRead marque automatiquement la notification associée comme lue côté backend
        await MessageService.markAsRead(message.id);
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m));
        setSelectedMessage({ ...message, is_read: true });
      } catch (error: any) {
        // Ignorer silencieusement les erreurs 404 (message non trouvé) - peut arriver si le message a été supprimé
        if (error?.status !== 404) {
          console.error("Erreur lors du marquage du message comme lu:", error);
        }
        // Continuer à afficher le message même en cas d'erreur
      }
    }
  };

  // Suppression
  const handleDeleteClick = (id: string | number) => {
    setMessageToDelete(String(id));
    setShowDeleteModal(true);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    try {
      await MessageService.deleteMessage(messageToDelete);
      setMessages(prev => prev.filter(m => m.id !== messageToDelete));
      if (selectedMessage?.id === messageToDelete) setSelectedMessage(null);
      toast.success('Supprimé', 'Message supprimé');
    } catch (error) {
      toast.error('Erreur', 'Impossible de supprimer');
    } finally {
      setShowDeleteModal(false);
      setMessageToDelete(null);
    }
  };

  // Recherche
  const filteredMessages = messages.filter(message => {
    const search = searchTerm.toLowerCase();
    const sender = message.sender;
    const recipient = message.recipient;

    const senderLabel = `${sender?.name || ''} ${sender?.email || ''}`.toLowerCase();
    const recipientLabel = `${recipient?.name || ''} ${recipient?.email || ''}`.toLowerCase();

    return (
      (message.subject || '').toLowerCase().includes(search) ||
      (message.content || '').toLowerCase().includes(search) ||
      (activeTab === 'inbox' ? senderLabel : recipientLabel).includes(search)
    );
  });

  // Helpers
  const getPerson = (message: MessageEntry): UserInfo | undefined => {
    return activeTab === 'inbox' || activeTab === 'course' ? message.sender : message.recipient;
  };

  const renderAvatar = (person?: UserInfo) => {
    if (!person) return null;
    const initials = person.name?.charAt(0).toUpperCase() || person.email?.charAt(0).toUpperCase() || '?';

    return person.profile_picture ? (
      <img src={person.profile_picture} alt={person.name || ''} className="w-8 h-8 rounded-full object-cover" />
    ) : (
      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-700">
        {initials}
      </div>
    );
  };

  const formatPerson = (person?: UserInfo) => {
    return person?.name || person?.email || 'Inconnu';
  };

  return (
    <div className="max-w-full mx-auto p-4 space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Onglets */}
        <div className="flex border-b border-gray-200">
          <TabButton icon={<Inbox className="w-5 h-5" />} label="Réception" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
          <TabButton icon={<Send className="w-5 h-5" />} label="Envoyés" active={activeTab === 'sent'} onClick={() => setActiveTab('sent')} />
          {courseId && (
            <TabButton icon={<Users className="w-5 h-5" />} label="Cours" active={activeTab === 'course'} onClick={() => setActiveTab('course')} />
          )}
          <TabButton icon={<Plus className="w-5 h-5" />} label="Nouveau" active={activeTab === 'compose'} onClick={() => setActiveTab('compose')} />
        </div>

        {/* Barre de recherche */}
        {activeTab !== 'compose' && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                />
              </div>
              <button
                onClick={loadMessages}
                disabled={loading}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {/* Contenu */}
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
          {/* Liste */}
          {activeTab !== 'compose' && (
            <div className="border-r border-gray-200 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mdsc-blue-primary mx-auto mb-3"></div>
                  <p>Chargement...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
  <p className="font-medium text-gray-700 dark:text-gray-200">
    {activeTab === 'inbox' ? 'Aucun message reçu' :
     activeTab === 'sent' ? 'Aucun message envoyé' :
     'Aucun message'}
  </p>
  <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
    {activeTab === 'inbox' ? 'Vos messages reçus apparaîtront ici' :
     activeTab === 'sent' ? 'Vos messages envoyés apparaîtront ici' :
     'Les messages du cours apparaîtront ici'}
  </p>
</div>) : (
                <div>
  <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
    {filteredMessages.length} message{filteredMessages.length > 1 ? 's' : ''}
    {activeTab === 'inbox' && (
      <span className="ml-2">
        ({filteredMessages.filter(m => !m.is_read).length} non lu{filteredMessages.filter(m => !m.is_read).length > 1 ? 's' : ''})
      </span>
    )}
  </div>
  {filteredMessages.map((msg) => {
    const person = getPerson(msg);
    return (
      <div
        key={msg.id}
        onClick={() => handleOpenMessage(msg)}
        className={`
          p-4 border-b border-gray-200 dark:border-gray-700
          cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50
          transition-colors
          ${!msg.is_read && activeTab === 'inbox' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
          ${selectedMessage?.id === msg.id ? 'bg-mdsc-blue-50 dark:bg-mdsc-blue-900/30 border-l-4 border-mdsc-blue-primary' : ''}
        `}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {!msg.is_read && activeTab === 'inbox' && (
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full flex-shrink-0" />
            )}
            {msg.is_read && activeTab === 'inbox' && (
              <MailOpen className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
            {activeTab === 'sent' && (
              <Send className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
            {renderAvatar(person)}
            <span className="font-medium text-gray-900 dark:text-gray-50 truncate">
              {formatPerson(person)}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
            {new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <p className="font-medium text-gray-900 dark:text-gray-50 mb-1 truncate">
          {msg.subject || '(Sans objet)'}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {msg.content || ''}
        </p>
        {msg.message_type && msg.message_type !== 'direct' && (
          <span className="inline-block mt-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
            {msg.message_type === 'broadcast' ? 'Diffusion' : msg.message_type}
          </span>
        )}
      </div>
    );
  })}
</div>
              )}
            </div>
          )}

          {/* Détail / Composer */}
          <div className={`${activeTab === 'compose' ? 'lg:col-span-3' : 'lg:col-span-2'} overflow-y-auto p-6`}>
            {activeTab === 'compose' ? (
              courseId ? (
                <form onSubmit={handleSendMessage} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800 font-medium">Diffusion à tous les participants</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Objet <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={composeData.subject}
                      onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary"
                      placeholder="Objet du message"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message <span className="text-red-500">*</span></label>
                    <textarea
                      value={composeData.content}
                      onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary"
                      placeholder="Votre message..."
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setActiveTab('inbox')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Annuler
                    </button>
                    <button type="submit" className="px-6 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark">
                      Envoyer
                    </button>
                  </div>
                </form>
              ) : (
                <MessageComposer onSend={handleComposerSend} onCancel={() => setActiveTab('inbox')} />
              )
            ) : selectedMessage ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedMessage.subject || '(Sans objet)'}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      {/* Expéditeur */}
                      <div className="flex items-center gap-2">
                        {renderAvatar(selectedMessage.sender)}
                        <span className="font-medium">
                          De: {formatPerson(selectedMessage.sender)}
                        </span>
                      </div>
                      {selectedMessage.message_type && selectedMessage.message_type !== 'direct' && (
                        <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          <Users className="w-3 h-3" />
                          {selectedMessage.message_type === 'broadcast' ? 'Diffusion' : selectedMessage.message_type}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(selectedMessage.created_at).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {activeTab === 'inbox' && (
                        <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${selectedMessage.is_read ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          <MailOpen className="w-3 h-3" />
                          {selectedMessage.is_read ? 'Lu' : 'Non lu'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteClick(selectedMessage.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="prose max-w-none bg-gray-50 rounded-lg p-6">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedMessage.content || '(Aucun contenu)'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Sélectionnez un message</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMessageToDelete(null);
        }}
        onConfirm={handleDeleteMessage}
        title="Supprimer le message"
        message="Cette action est irréversible."
        confirmText="Supprimer"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
      />
    </div>
  );
}

// Composant bouton onglet
const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-colors ${active
      ? 'text-mdsc-blue-primary border-b-2 border-mdsc-blue-primary'
      : 'text-gray-600 hover:text-gray-900'
      }`}
  >
    {icon}
    {label}
  </button>
);
// 'use client';

// import React, { useState, useEffect } from 'react';
// import { Inbox, Send, Plus, Search, Mail, MailOpen, Trash2, Clock, User, Users, RefreshCw } from 'lucide-react';
// import { MessageService, MessageEntry, PaginatedMessages } from '../../../lib/services/messageService';
// import { useAuthStore } from '../../../lib/stores/authStore';
// import MessageComposer from '../../messages/MessageComposer';
// import toast from '../../../lib/utils/toast';
// import ConfirmModal from '../../ui/ConfirmModal';

// interface MessagesProps {
//   courseId?: string;
// }

// export default function Messages({ courseId }: MessagesProps) {
//   const { user } = useAuthStore();
//   const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose' | 'course'>('inbox');
//   const [messages, setMessages] = useState<MessageEntry[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedMessage, setSelectedMessage] = useState<MessageEntry | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
//   const [composeData, setComposeData] = useState({
//     receiverEmail: '',
//     subject: '',
//     content: '',
//   });

//   useEffect(() => {
//     loadMessages();
//   }, [activeTab, courseId]);

//   const loadMessages = async () => {
//     setLoading(true);
//     try {
//       let response: PaginatedMessages | null = null;
//       if (activeTab === 'inbox') {
//         response = await MessageService.getReceivedMessages();
//       } else if (activeTab === 'sent') {
//         response = await MessageService.getSentMessages();
//       } else if (activeTab === 'course' && courseId) {
//         response = await MessageService.getCourseMessages?.(courseId) ?? null;
//       }
//       const data = response ? response.messages ?? [] : [];
//       setMessages(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.error('Error loading messages:', error);
//       setMessages([]); // En cas d'erreur, initialiser avec un tableau vide
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSendMessage = async () => {
//     // Vérifier si c'est un message de broadcast
//     if (activeTab === 'course' && courseId) {
//       if (!composeData.subject || !composeData.content) {
//         toast.warning('Formulaire incomplet', 'Veuillez remplir tous les champs');
//         return;
//       }

//       try {
//         await MessageService.sendBroadcastMessage({
//           courseId,
//           subject: composeData.subject,
//           content: composeData.content,
//           type: 'broadcast',
//         });
//         toast.success('Message envoyé', 'Message envoyé avec succès à tous les participants du cours');
//         setComposeData({ receiverEmail: '', subject: '', content: '' });
//         setActiveTab('course');
//         loadMessages();
//       } catch (error: any) {
//         console.error('Error sending broadcast message:', error);
//         toast.error('Erreur', error.message || 'Erreur lors de l\'envoi du message');
//       }
//       return;
//     }
//   };

//   const handleComposerSend = () => {
//     loadMessages();
//     setActiveTab('inbox');
//   };

//   const handleOpenMessage = async (message: MessageEntry) => {
//     setSelectedMessage(message);
//     if (!message.is_read) {
//       await MessageService.markAsRead(message.id);
//       message.is_read = true;
//     }
//   };

//   const handleDeleteClick = (messageId: string | number) => {
//     setMessageToDelete(String(messageId));
//     setShowDeleteModal(true);
//   };

//   const handleDeleteMessage = async () => {
//     if (!messageToDelete) return;

//     try {
//       await MessageService.deleteMessage(messageToDelete);
//       setMessages(messages.filter(m => m.id !== messageToDelete));
//       if (selectedMessage?.id === messageToDelete) {
//         setSelectedMessage(null);
//       }
//       toast.success('Message supprimé', 'Le message a été supprimé avec succès');
//       setShowDeleteModal(false);
//       setMessageToDelete(null);
//     } catch (error) {
//       console.error('Error deleting message:', error);
//       toast.error('Erreur', 'Erreur lors de la suppression');
//     }
//   };

//   const filteredMessages = Array.isArray(messages) ? messages.filter(message => {
//     const searchLower = searchTerm.toLowerCase();
//     const senderLabel = message.sender_name || message.sender_email || '';
//     const receiverLabel = message.recipient_name || message.recipient_email || '';
//     return (
//       (message.subject || '').toLowerCase().includes(searchLower) ||
//       (message.content || '').toLowerCase().includes(searchLower) ||
//       (activeTab === 'inbox' ? senderLabel : receiverLabel).toLowerCase().includes(searchLower)
//     );
//   }) : [];

//   return (
//     <div className="space-y-6">
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200">
//         <div className="flex border-b border-gray-200">
//           <button
//             onClick={() => setActiveTab('inbox')}
//             className={`flex-1 px-4 py-4 text-center font-medium transition-colors ${
//               activeTab === 'inbox'
//                 ? 'text-mdsc-blue-primary border-b-2 border-mdsc-blue-primary'
//                 : 'text-gray-600 hover:text-gray-900'
//             }`}
//           >
//             <Inbox className="h-5 w-5 inline-block mr-2" />
//             Boîte de réception
//           </button>
//           <button
//             onClick={() => setActiveTab('sent')}
//             className={`flex-1 px-4 py-4 text-center font-medium transition-colors ${
//               activeTab === 'sent'
//                 ? 'text-mdsc-blue-primary border-b-2 border-mdsc-blue-primary'
//                 : 'text-gray-600 hover:text-gray-900'
//             }`}
//           >
//             <Send className="h-5 w-5 inline-block mr-2" />
//             Envoyés
//           </button>
//           {courseId && (
//             <button
//               onClick={() => setActiveTab('course')}
//               className={`flex-1 px-4 py-4 text-center font-medium transition-colors ${
//                 activeTab === 'course'
//                   ? 'text-mdsc-blue-primary border-b-2 border-mdsc-blue-primary'
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               <Users className="h-5 w-5 inline-block mr-2" />
//               Messages du cours
//             </button>
//           )}
//           <button
//             onClick={() => setActiveTab('compose')}
//             className={`flex-1 px-4 py-4 text-center font-medium transition-colors ${
//               activeTab === 'compose'
//                 ? 'text-mdsc-blue-primary border-b-2 border-mdsc-blue-primary'
//                 : 'text-gray-600 hover:text-gray-900'
//             }`}
//           >
//             <Plus className="h-5 w-5 inline-block mr-2" />
//             Nouveau message
//           </button>
//         </div>

//         {activeTab !== 'compose' && (
//           <div className="p-4 border-b border-gray-200">
//             <div className="flex items-center space-x-2">
//               <div className="relative flex-1">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Rechercher dans les messages..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
//                 />
//               </div>
//               <button
//                 onClick={loadMessages}
//                 disabled={loading}
//                 className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                 title="Rafraîchir les messages"
//               >
//                 <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
//               </button>
//             </div>
//           </div>
//         )}

//         <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
//           {activeTab !== 'compose' && (
//             <div className="border-r border-gray-200 overflow-y-auto">
//               {loading ? (
//                 <div className="p-8 text-center text-gray-500">
//                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mdsc-blue-primary mx-auto mb-2"></div>
//                   Chargement des messages...
//                 </div>
//               ) : filteredMessages.length === 0 ? (
//                 <div className="p-8 text-center text-gray-500">
//                   <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
//                   <p className="font-medium">
//                     {activeTab === 'course'
//                       ? 'Aucun message dans ce cours'
//                       : activeTab === 'inbox'
//                         ? 'Aucun message reçu'
//                         : 'Aucun message envoyé'}
//                   </p>
//                   <p className="text-sm mt-2">
//                     {activeTab === 'inbox'
//                       ? 'Vos messages reçus apparaîtront ici'
//                       : activeTab === 'sent'
//                         ? 'Vos messages envoyés apparaîtront ici'
//                         : 'Les messages du cours apparaîtront ici'}
//                   </p>
//                 </div>
//               ) : (
//                 <div>
//                   <div className="p-3 bg-gray-50 border-b border-gray-200">
//                     <p className="text-sm text-gray-600">
//                       {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'}
//                       {activeTab === 'inbox' && (
//                         <span className="ml-2">
//                           ({filteredMessages.filter(m => !m.is_read).length} non lu{filteredMessages.filter(m => !m.is_read).length !== 1 ? 's' : ''})
//                         </span>
//                       )}
//                     </p>
//                   </div>
//                   {filteredMessages.map((message) => (
//                     <div
//                       key={message.id}
//                       onClick={() => handleOpenMessage(message)}
//                       className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
//                         !message.is_read && activeTab === 'inbox' ? 'bg-blue-50' : ''
//                       } ${selectedMessage?.id === message.id ? 'bg-mdsc-blue-50 border-l-4 border-mdsc-blue-primary' : ''}`}
//                     >
//                       <div className="flex items-start justify-between mb-2">
//                         <div className="flex items-center space-x-2 flex-1 min-w-0">
//                           {!message.is_read && activeTab === 'inbox' && (
//                             <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
//                           )}
//                           {message.is_read && activeTab === 'inbox' && (
//                             <MailOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
//                           )}
//                           {activeTab === 'sent' && (
//                             <Send className="h-4 w-4 text-gray-400 flex-shrink-0" />
//                           )}
//                           <span className="font-medium text-gray-900 truncate">
//                             {activeTab === 'inbox'
//                               ? (message.sender_name || message.sender_email || 'Expéditeur inconnu')
//                               : activeTab === 'course'
//                                 ? (message.sender_name || message.sender_email || 'Expéditeur inconnu')
//                                 : (message.recipient_name || message.recipient_email || 'Destinataire inconnu')}
//                           </span>
//                         </div>
//                         <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
//                           {new Date(message.created_at ?? '').toLocaleDateString('fr-FR', {
//                             day: 'numeric',
//                             month: 'short',
//                             year: new Date(message.created_at ?? '').getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
//                           })}
//                         </span>
//                       </div>
//                       <p className="font-medium text-gray-900 mb-1 truncate">{message.subject || '(Sans objet)'}</p>
//                       <p className="text-sm text-gray-600 line-clamp-2">{message.content || ''}</p>
//                       {message.type && message.type !== 'direct' && (
//                         <span className="inline-block mt-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
//                           {message.type === 'broadcast' ? 'Diffusion' : message.type === 'announcement' ? 'Annonce' : message.type}
//                         </span>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           <div className={`${activeTab === 'compose' ? 'lg:col-span-3' : 'lg:col-span-2'} overflow-y-auto p-6`}>
//             {activeTab === 'compose' ? (
//               <div className="space-y-6">
//                 {courseId ? (
//                   <>
//                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                       <div className="flex items-center">
//                         <Users className="h-5 w-5 text-blue-600 mr-2" />
//                         <span className="text-blue-800 font-medium">
//                           Vous allez envoyer un message à tous les participants de ce cours
//                         </span>
//                       </div>
//                     </div>
//                     <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="space-y-6">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Objet <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           value={composeData.subject}
//                           onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
//                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
//                           placeholder="Objet du message"
//                           required
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Message <span className="text-red-500">*</span>
//                         </label>
//                         <textarea
//                           value={composeData.content}
//                           onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
//                           rows={12}
//                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
//                           placeholder="Votre message sera envoyé à tous les participants du cours..."
//                           required
//                         />
//                       </div>

//                       <div className="flex justify-end space-x-4">
//                         <button
//                           type="button"
//                           onClick={() => {
//                             setComposeData({ receiverEmail: '', subject: '', content: '' });
//                             setActiveTab('inbox');
//                           }}
//                           className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//                         >
//                           Annuler
//                         </button>
//                         <button
//                           type="submit"
//                           className="px-6 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors"
//                         >
//                           Envoyer
//                         </button>
//                       </div>
//                     </form>
//                   </>
//                 ) : (
//                   <MessageComposer
//                     onSend={handleComposerSend}
//                     onCancel={() => setActiveTab('inbox')}
//                   />
//                 )}
//               </div>
//             ) : selectedMessage ? (
//               <div className="space-y-6">
//                 <div className="flex items-start justify-between pb-4 border-b border-gray-200">
//                   <div className="flex-1">
//                     <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedMessage.subject || '(Sans objet)'}</h2>
//                     <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
//                       <span className="flex items-center">
//                         <User className="h-4 w-4 mr-1" />
//                         <span className="font-medium">
//                           {activeTab === 'inbox'
//                             ? `De: ${selectedMessage.sender_name || selectedMessage.sender_email || 'Expéditeur inconnu'}`
//                             : activeTab === 'course'
//                               ? `De: ${selectedMessage.sender_name || selectedMessage.sender_email || 'Expéditeur inconnu'}`
//                               : `À: ${selectedMessage.recipient_name || selectedMessage.recipient_email || 'Destinataire inconnu'}`}
//                         </span>
//                       </span>
//                       {selectedMessage.type && selectedMessage.type !== 'direct' && (
//                         <span className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
//                           <Users className="h-3 w-3 mr-1" />
//                           {selectedMessage.type === 'broadcast' ? 'Diffusion' : selectedMessage.type === 'announcement' ? 'Annonce' : selectedMessage.type}
//                         </span>
//                       )}
//                       <span className="flex items-center">
//                         <Clock className="h-4 w-4 mr-1" />
//                         {new Date(selectedMessage.created_at ?? '').toLocaleString('fr-FR', {
//                           day: 'numeric',
//                           month: 'long',
//                           year: 'numeric',
//                           hour: '2-digit',
//                           minute: '2-digit'
//                         })}
//                       </span>
//                       {activeTab === 'inbox' && (
//                         <span className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
//                           selectedMessage.is_read
//                             ? 'bg-green-100 text-green-800'
//                             : 'bg-blue-100 text-blue-800'
//                         }`}>
//                           <MailOpen className="h-3 w-3 mr-1" />
//                           {selectedMessage.is_read ? 'Lu' : 'Non lu'}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => handleDeleteClick(selectedMessage.id)}
//                     className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4"
//                     title="Supprimer le message"
//                   >
//                     <Trash2 className="h-5 w-5" />
//                   </button>
//                 </div>

//                 <div className="prose max-w-none bg-gray-50 rounded-lg p-6">
//                   <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedMessage.content || '(Message vide)'}</p>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-center justify-center h-full text-gray-500">
//                 <div className="text-center">
//                   <Mail className="h-16 w-16 mx-auto mb-4 text-gray-400" />
//                   <p>Sélectionnez un message pour le lire</p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Modal de confirmation de suppression */}
//       <ConfirmModal
//         isOpen={showDeleteModal}
//         onClose={() => {
//           setShowDeleteModal(false);
//           setMessageToDelete(null);
//         }}
//         onConfirm={handleDeleteMessage}
//         title="Confirmer la suppression"
//         message="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
//         confirmText="Supprimer"
//       />
//     </div>
//   );
// }