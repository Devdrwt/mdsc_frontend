'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import Modal from '../ui/Modal';
import MessageComposer from '../messages/MessageComposer';
import { courseService } from '../../lib/services/courseService';
import toast from '../../lib/utils/toast';
import { Loader } from 'lucide-react';

interface FloatingChatButtonProps {
  courseId: number | string;
  courseTitle?: string;
}

export default function FloatingChatButton({ courseId, courseTitle }: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [instructorEmail, setInstructorEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !instructorEmail) {
      loadInstructorEmail();
    }
  }, [isOpen, courseId]);

  const loadInstructorEmail = async () => {
    try {
      setLoading(true);
      const courseData = await courseService.getCourseById(courseId.toString());
      
      // Chercher l'email de l'instructeur dans les données du cours
      // Le backend retourne instructor.email dans l'objet instructor formaté
      const email = 
        (courseData as any).instructor?.email ||
        (courseData as any).instructor_email ||
        null;
      
      if (email) {
        setInstructorEmail(email);
      } else {
        // Si pas d'email, permettre à l'utilisateur de saisir manuellement
        console.warn('Email de l\'instructeur non trouvé dans les données du cours');
        // On laisse l'utilisateur saisir l'email manuellement dans MessageComposer
        // Ne pas définir instructorEmail pour permettre la saisie manuelle
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement de l\'instructeur:', error);
      // Ne pas afficher d'erreur, permettre à l'utilisateur de saisir l'email manuellement
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    setIsOpen(false);
    // Le toast est déjà affiché dans MessageComposer, pas besoin de le réafficher ici
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[#3B7C8A] hover:bg-[#2d5f6a] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        aria-label="Contacter le formateur"
        title="Contacter le formateur"
      >
        <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Modal de chat */}
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title="Posez vos questions au formateur"
        size="lg"
      >
        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-6 w-6 animate-spin text-[#3B7C8A]" />
              <span className="ml-3 text-gray-600">Chargement des informations...</span>
            </div>
          ) : (
            <MessageComposer
              hiddenReceiverEmail={instructorEmail || undefined}
              onSend={handleSend}
              onCancel={handleCancel}
            />
          )}
        </div>
      </Modal>
    </>
  );
}

