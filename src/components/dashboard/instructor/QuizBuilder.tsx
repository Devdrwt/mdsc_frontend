'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, Eye, AlertCircle, CheckCircle, XCircle, Clock, Target, FileQuestion } from 'lucide-react';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import FormSection from '../../shared/FormSection';
import FormInput from '../../shared/FormInput';
import toast from '../../../lib/utils/toast';

interface Quiz {
  id?: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  description: string;
  time_limit_minutes?: number;
  passing_score: number;
  max_attempts: number;
  is_final: boolean;
  is_published: boolean;
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[]; // Pour multiple_choice
  correct_answer: string;
  points: number;
  order_index: number;
}

interface QuizBuilderProps {
  courseId: string;
  lessonId?: string;
  quizType: 'formative' | 'assessment';
  initialQuiz?: Quiz;
  onSave: (quiz: Quiz) => Promise<void>;
  onCancel: () => void;
}

export default function QuizBuilder({
  courseId,
  lessonId,
  quizType,
  initialQuiz,
  onSave,
  onCancel,
}: QuizBuilderProps) {
  const [formData, setFormData] = useState<Omit<Quiz, 'course_id'>>({
    title: initialQuiz?.title || '',
    description: initialQuiz?.description || '',
    time_limit_minutes: initialQuiz?.time_limit_minutes,
    passing_score: initialQuiz?.passing_score || 70,
    max_attempts: initialQuiz?.max_attempts || quizType === 'formative' ? 0 : 3,
    is_final: initialQuiz?.is_final || quizType === 'assessment',
    is_published: initialQuiz?.is_published || false,
    questions: initialQuiz?.questions || [],
  });

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<Omit<QuizQuestion, 'order_index'>>({
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
  });
  const [saving, setSaving] = useState(false);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer,
      points: question.points,
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = () => {
    if (!questionForm.question_text || !questionForm.correct_answer) {
      toast.warning('Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (questionForm.question_type === 'multiple_choice' && questionForm.options.length < 2) {
      toast.warning('Options insuffisantes', 'Veuillez ajouter au moins 2 options');
      return;
    }

    const newQuestions = [...formData.questions];
    
    if (editingQuestion) {
      // Modifier la question existante
      const index = newQuestions.findIndex(q => q.id === editingQuestion.id);
      if (index !== -1) {
        newQuestions[index] = {
          ...editingQuestion,
          ...questionForm,
        };
      }
    } else {
      // Ajouter une nouvelle question
      const newQuestion: QuizQuestion = {
        ...questionForm,
        order_index: newQuestions.length + 1,
        options: questionForm.question_type === 'multiple_choice' ? questionForm.options : [],
      };
      newQuestions.push(newQuestion);
    }

    setFormData({
      ...formData,
      questions: newQuestions,
    });
    
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (index: number) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    // Réordonner les questions
    newQuestions.forEach((q, i) => {
      q.order_index = i + 1;
    });
    setFormData({
      ...formData,
      questions: newQuestions,
    });
  };

  const handleSave = async () => {
    if (!formData.title || formData.questions.length === 0) {
      toast.warning('Formulaire incomplet', 'Veuillez remplir le titre et ajouter au moins une question');
      return;
    }

    setSaving(true);
    try {
      const quiz: Quiz = {
        ...formData,
        course_id: courseId,
        lesson_id: lessonId,
      };
      await onSave(quiz);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du quiz:', error);
      toast.error('Erreur', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const getTotalPoints = () => {
    return formData.questions.reduce((sum, q) => sum + q.points, 0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialQuiz ? 'Modifier le quiz' : 'Créer un quiz'}
          </h2>
          <div className="flex items-center space-x-2">
            {quizType === 'formative' ? (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center space-x-1">
                <FileQuestion className="h-4 w-4" />
                <span>Quiz Formatif</span>
              </span>
            ) : (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center space-x-1">
                <Target className="h-4 w-4" />
                <span>Quiz d'Évaluation</span>
              </span>
            )}
          </div>
        </div>
        <p className="text-gray-600">
          {quizType === 'formative' 
            ? 'Quiz intégré dans la leçon - non bloquant pour la progression'
            : 'Quiz d\'évaluation - peut bloquer l\'obtention du certificat'
          }
        </p>
      </div>

      {/* Informations du quiz */}
      <FormSection title="Informations générales" icon={FileQuestion}>
        <div className="space-y-4">
          <FormInput
            label="Titre du quiz"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
              placeholder="Description du quiz..."
            />
          </div>
        </div>
      </FormSection>

      {/* Configuration */}
      <FormSection title="Configuration" icon={Target}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score minimum (%) 
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.passing_score}
              onChange={(e) => setFormData({ ...formData, passing_score: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Score requis pour réussir</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Temps limité (min)</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.time_limit_minutes || ''}
              onChange={(e) => setFormData({ ...formData, time_limit_minutes: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
              placeholder="Illimité"
            />
            <p className="text-xs text-gray-500 mt-1">0 = illimité</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tentatives max
            </label>
            <input
              type="number"
              min="0"
              value={formData.max_attempts}
              onChange={(e) => setFormData({ ...formData, max_attempts: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
            />
            <p className="text-xs text-gray-500 mt-1">0 = illimité</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="w-4 h-4 text-mdsc-blue-primary"
            />
            <span className="text-sm font-medium text-gray-700">Publier le quiz</span>
          </label>
        </div>
      </FormSection>

      {/* Questions */}
      <FormSection title={`Questions (${formData.questions.length})`} icon={FileQuestion}>
        <div className="space-y-4">
          {/* Liste des questions */}
          {formData.questions.map((question, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 w-8 h-8 bg-mdsc-blue-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">{question.question_text}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 rounded">{question.question_type}</span>
                      <span className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>{question.points} point{question.points > 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditQuestion(question)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Bouton ajouter question */}
          <button
            onClick={handleAddQuestion}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-mdsc-blue-primary hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5 text-gray-400" />
            <span className="text-gray-600 font-medium">Ajouter une question</span>
          </button>

          {formData.questions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <span className="font-medium text-blue-900">Total des points</span>
              <span className="text-2xl font-bold text-blue-600">{getTotalPoints()}</span>
            </div>
          )}
        </div>
      </FormSection>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || formData.questions.length === 0}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      {/* Modal d'édition de question */}
      <Modal
        isOpen={showQuestionModal}
        onClose={() => {
          setShowQuestionModal(false);
          setEditingQuestion(null);
        }}
        title={editingQuestion ? 'Modifier la question' : 'Ajouter une question'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de question
            </label>
            <select
              value={questionForm.question_type}
              onChange={(e) => {
                const newType = e.target.value as any;
                setQuestionForm({
                  ...questionForm,
                  question_type: newType,
                  options: newType === 'multiple_choice' ? ['', '', '', ''] : [],
                  correct_answer: '',
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
            >
              <option value="multiple_choice">Choix multiples</option>
              <option value="true_false">Vrai/Faux</option>
              <option value="short_answer">Réponse courte</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question *
            </label>
            <textarea
              value={questionForm.question_text}
              onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
              placeholder="Entrez votre question..."
            />
          </div>

          {questionForm.question_type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options (4 au maximum)
              </label>
              <div className="space-y-2">
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="w-8 text-center font-bold">{String.fromCharCode(65 + index)}</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options];
                        newOptions[index] = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOptions });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
                    />
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="correct_answer"
                        value={String.fromCharCode(65 + index)}
                        checked={questionForm.correct_answer === String.fromCharCode(65 + index)}
                        onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                        className="w-4 h-4 text-mdsc-blue-primary"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {questionForm.question_type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Réponse correcte
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correct_answer_tf"
                    value="true"
                    checked={questionForm.correct_answer === 'true'}
                    onChange={() => setQuestionForm({ ...questionForm, correct_answer: 'true' })}
                    className="w-4 h-4 text-green-500"
                  />
                  <span className="text-green-700 font-medium">Vrai</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correct_answer_tf"
                    value="false"
                    checked={questionForm.correct_answer === 'false'}
                    onChange={() => setQuestionForm({ ...questionForm, correct_answer: 'false' })}
                    className="w-4 h-4 text-red-500"
                  />
                  <span className="text-red-700 font-medium">Faux</span>
                </label>
              </div>
            </div>
          )}

          {questionForm.question_type === 'short_answer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Réponse correcte *
              </label>
              <input
                type="text"
                value={questionForm.correct_answer}
                onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
                placeholder="Entrez la réponse attendue..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={questionForm.points}
              onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mdsc-blue-primary"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowQuestionModal(false);
                setEditingQuestion(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSaveQuestion}>
              {editingQuestion ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

