'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Mail, User, Send, Loader, X } from 'lucide-react';
import { MessageService } from '../../lib/services/messageService';
import AdminService from '../../lib/services/adminService';
import toast from '../../lib/utils/toast';

interface UserSearchResult {
  id: string | number;
  name: string;
  email: string;
  role: string;
}

interface MessageComposerProps {
  onSend?: () => void;
  onCancel?: () => void;
  initialReceiverEmail?: string;
}

export default function MessageComposer({
  onSend,
  onCancel,
  initialReceiverEmail,
}: MessageComposerProps) {
  const [receiverEmail, setReceiverEmail] = useState(initialReceiverEmail || '');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [sending, setSending] = useState(false);
  const [searchAvailable, setSearchAvailable] = useState(true);
  const hasAlertedSearchRef = useRef(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialReceiverEmail) {
      triggerSearch(initialReceiverEmail);
    }
  }, [initialReceiverEmail]);

  useEffect(() => () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const triggerSearch = (email: string) => {
    if (!searchAvailable || !email || email.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    AdminService.getUsers({ search: email, limit: 10 })
      .then(({ users }) => {
        const normalizedResults = (users ?? [])
          .map<UserSearchResult | null>((user, index) => {
            const emailValue = user.email ?? '';
            if (!emailValue) {
              return null;
            }

            const displayName =
              user.name ||
              [user.first_name, user.last_name]
                .filter(Boolean)
                .join(' ')
                .trim() ||
              emailValue;

            const roleLabel = user.role ?? user.role_name ?? 'utilisateur';
            const rawId = user.id ?? user.user_id ?? emailValue ?? index;
            const normalizedId = typeof rawId === 'number' ? rawId : String(rawId);

            return {
              id: normalizedId,
              name: displayName,
              email: emailValue,
              role: roleLabel,
            };
          })
          .filter((user): user is UserSearchResult => Boolean(user));

        setSearchResults(normalizedResults);
        setShowResults(normalizedResults.length > 0);
      })
      .catch((error: any) => {
        if (error?.status === 403) {
          setSearchAvailable(false);
          setSearchResults([]);
          setShowResults(false);
          if (!hasAlertedSearchRef.current) {
            toast.info(
              'Recherche désactivée',
              'Vous pouvez saisir l’adresse email manuellement pour envoyer un message.'
            );
            hasAlertedSearchRef.current = true;
          }
          return;
        }
        console.error('Erreur lors de la recherche:', error);
        setSearchResults([]);
        setShowResults(false);
      })
      .finally(() => {
        setSearching(false);
      });
  };

  const handleEmailChange = (email: string) => {
    setReceiverEmail(email);
    setSelectedUser(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchAvailable || !email) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => triggerSearch(email), 500);
  };

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedUser(user);
    setReceiverEmail(user.email);
    setShowResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiverEmail || !subject || !content) {
      toast.warning('Formulaire incomplet', 'Veuillez remplir tous les champs');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(receiverEmail)) {
      toast.warning('Email invalide', 'Veuillez entrer une adresse email valide');
      return;
    }

    setSending(true);
    try {
      await MessageService.sendMessage({
        recipient_email: receiverEmail,
        recipient_id: selectedUser?.id,
        subject,
        content,
        type: 'direct',
      });
      toast.success('Message envoyé', 'Votre message a été envoyé avec succès');

      setReceiverEmail('');
      setSubject('');
      setContent('');
      setSelectedUser(null);
      setSearchResults([]);
      setShowResults(false);

      onSend?.();
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error('Erreur', error.message || "Impossible d'envoyer le message");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destinataire (Email) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            value={receiverEmail}
            onChange={(e) => handleEmailChange(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowResults(true);
              }
            }}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Saisir ou rechercher par email (ex: john@example.com)"
            required
          />

          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searching && (
                <div className="p-3 text-center text-gray-500">
                  <Loader className="h-5 w-5 animate-spin mx-auto" />
                  <span className="ml-2">Recherche...</span>
                </div>
              )}
              {!searching && searchResults.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="mt-2 flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{selectedUser.name}</span>
              <span className="text-xs text-blue-600">({selectedUser.email})</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setReceiverEmail('');
                }}
                className="ml-auto p-1 text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {searchAvailable
            ? "Recherchez un utilisateur par son adresse email ou saisissez-la directement."
            : "Recherche désactivée. Veuillez saisir l'adresse email manuellement."}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sujet <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Sujet du message"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="Votre message..."
          required
        />
      </div>

      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={sending}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={sending || !receiverEmail || !subject || !content}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {sending ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Envoi...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Envoyer</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

