'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, AlertCircle, CheckCircle, Clock, Target, FileQuestion, X, Award } from 'lucide-react';
import toast from '../../../lib/utils/toast';
import { quizService } from '../../../lib/services/quizService';
import ConfirmModal from '../../ui/ConfirmModal';

interface QuizQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
}

interface ModuleQuiz {
  id?: string;
  module_id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  duration_minutes?: number;
  questions: QuizQuestion[];
}

interface ModuleQuizBuilderProps {
  moduleId: string;
  courseId: string;
  initialQuiz?: ModuleQuiz;
  onSave: () => void;
  onCancel: () => void;
}

export default function ModuleQuizBuilder({
  moduleId,
  courseId,
  initialQuiz,
  onSave,
  onCancel,
}: ModuleQuizBuilderProps) {
  const [formData, setFormData] = useState<Omit<ModuleQuiz, 'module_id' | 'course_id'>>({
    title: initialQuiz?.title || 'Quiz du module',
    description: initialQuiz?.description || '',
    passing_score: initialQuiz?.passing_score || 70,
    duration_minutes: initialQuiz?.duration_minutes,
    questions: (initialQuiz?.questions || []).map((q, idx) => {
      // Normaliser les options : convertir un tableau d'objets en tableau de strings si nécessaire
      let normalizedOptions: string[] = [];
      if (q.options) {
        if (Array.isArray(q.options)) {
          if (q.options.length > 0 && typeof q.options[0] === 'object') {
            // Format backend : tableau d'objets avec option_text
            normalizedOptions = (q.options as any[]).map((opt: any) => 
              typeof opt === 'string' ? opt : (opt.option_text || opt.text || '')
            ).filter((opt: string) => opt.trim());
          } else {
            // Format déjà correct : tableau de strings
            normalizedOptions = q.options.filter((opt: any) => typeof opt === 'string' && opt.trim());
          }
        }
      }
      
      return {
        ...q,
        id: q.id || `temp-${Date.now()}-${idx}-${Math.random()}`, // S'assurer que chaque question a un ID unique
        options: normalizedOptions.length > 0 ? normalizedOptions : (q.question_type === 'multiple_choice' ? ['', '', '', ''] : []),
      };
    }),
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
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
    
    // Normaliser les options : convertir un tableau d'objets en tableau de strings si nécessaire
    let normalizedOptions: string[] = [];
    if (question.options) {
      if (Array.isArray(question.options)) {
        if (question.options.length > 0 && typeof question.options[0] === 'object') {
          // Format backend : tableau d'objets avec option_text
          normalizedOptions = (question.options as any[]).map((opt: any) => 
            typeof opt === 'string' ? opt : (opt.option_text || opt.text || '')
          ).filter((opt: string) => opt.trim());
        } else {
          // Format déjà correct : tableau de strings
          normalizedOptions = question.options.filter((opt: any) => typeof opt === 'string' && opt.trim());
        }
      }
    }
    
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: normalizedOptions.length > 0 ? normalizedOptions : (question.question_type === 'multiple_choice' ? ['', '', '', ''] : []),
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

    // Pour les questions QCM, filtrer les options vides et vérifier qu'il y en a au moins 2
    let cleanedOptions = questionForm.options || [];
    if (questionForm.question_type === 'multiple_choice') {
      // Nettoyer strictement : trim chaque option et filtrer les vides
      cleanedOptions = questionForm.options
        .map((o: string) => String(o || '').trim())
        .filter((o: string) => o.length > 0);
      
      if (cleanedOptions.length < 2) {
        toast.warning('Options insuffisantes', 'Veuillez fournir au moins 2 options valides pour une question à choix multiples');
        return;
      }
      // Nettoyer aussi la réponse correcte pour la comparaison
      const trimmedCorrectAnswer = String(questionForm.correct_answer || '').trim();
      if (!cleanedOptions.includes(trimmedCorrectAnswer)) {
        toast.warning('Réponse incorrecte', 'La réponse correcte doit correspondre à l\'une des options valides');
        return;
      }
    }

    const newQuestion: QuizQuestion = {
      ...questionForm,
      options: cleanedOptions,
      // S'assurer que la réponse correcte est aussi nettoyée
      correct_answer: questionForm.question_type === 'multiple_choice' 
        ? String(questionForm.correct_answer || '').trim()
        : questionForm.correct_answer, // Utiliser les options nettoyées
      id: editingQuestion?.id || `temp-${Date.now()}-${Math.random()}`, // ID temporaire unique si nouvelle question
      order_index: editingQuestion 
        ? editingQuestion.order_index 
        : formData.questions.length + 1,
    };

    if (editingQuestion) {
      setFormData({
        ...formData,
        questions: formData.questions.map(q => 
          q.order_index === editingQuestion.order_index ? newQuestion : q
        ),
      });
    } else {
      setFormData({
        ...formData,
        questions: [...formData.questions, newQuestion],
      });
    }

    setShowQuestionModal(false);
    setEditingQuestion(null);
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
    });
  };

  const handleDeleteQuestion = (orderIndex: number) => {
    setFormData({
      ...formData,
      questions: formData.questions
        .filter(q => q.order_index !== orderIndex)
        .map((q, idx) => ({ ...q, order_index: idx + 1 })),
    });
  };

  const handleSave = async () => {
    if (!formData.title || formData.questions.length === 0) {
      toast.warning('Formulaire incomplet', 'Veuillez ajouter au moins une question au quiz');
      return;
    }

    // Valider et nettoyer les questions avant l'envoi
    const cleanedQuestions = formData.questions.map((q, idx) => {
      // Pour les questions QCM, filtrer les options vides et vérifier qu'il y en a au moins 2
      if (q.question_type === 'multiple_choice') {
        // Nettoyer plus strictement : enlever les espaces en début/fin et filtrer les chaînes vides
        const validOptions = (q.options || [])
          .map((opt: any) => {
            // Convertir en string et nettoyer
            const str = String(opt || '').trim();
            return str.length > 0 ? str : null;
          })
          .filter((opt: string | null): opt is string => opt !== null && opt.length > 0);
        
        if (validOptions.length < 2) {
          throw new Error(`La question ${idx + 1} (QCM) doit avoir au moins 2 réponses valides (actuellement: ${validOptions.length})`);
        }
        // Vérifier que la réponse correcte est toujours dans les options valides
        const trimmedCorrectAnswer = q.correct_answer ? String(q.correct_answer).trim() : '';
        if (trimmedCorrectAnswer && !validOptions.includes(trimmedCorrectAnswer)) {
          throw new Error(`La réponse correcte de la question ${idx + 1} ne correspond à aucune option valide`);
        }
        return {
          ...q,
          options: validOptions,
        };
      }
      // Pour les autres types de questions, retourner telles quelles
      return q;
    });

    // Validation finale : s'assurer que toutes les questions QCM ont au moins 2 options
    for (let i = 0; i < cleanedQuestions.length; i++) {
      const q = cleanedQuestions[i];
      if (q.question_type === 'multiple_choice') {
        const optionsCount = Array.isArray(q.options) ? q.options.length : 0;
        if (optionsCount < 2) {
          throw new Error(`La question ${i + 1} (QCM) doit avoir au moins 2 réponses. Actuellement: ${optionsCount} option(s)`);
        }
        // Vérifier que toutes les options sont des strings non vides
        const validOptionsCount = q.options.filter((opt: any) => {
          const str = String(opt || '').trim();
          return str.length > 0;
        }).length;
        if (validOptionsCount < 2) {
          throw new Error(`La question ${i + 1} (QCM) doit avoir au moins 2 réponses valides (non vides). Actuellement: ${validOptionsCount} option(s) valide(s)`);
        }
      }
    }

    setSaving(true);
    try {
      const quizData = {
        module_id: moduleId,
        course_id: courseId,
        title: formData.title,
        description: formData.description,
        passing_score: formData.passing_score,
        duration_minutes: formData.duration_minutes,
        questions: cleanedQuestions,
      };
      

      if (initialQuiz?.id) {
        // Pour la mise à jour, on utilise module_id au lieu de quizId
        await quizService.updateModuleQuiz(initialQuiz.id, quizData);
        toast.success('Quiz mis à jour', 'Le quiz du module a été mis à jour avec succès');
      } else {
        await quizService.createModuleQuiz(quizData);
        toast.success('Quiz créé', 'Le quiz du module a été créé avec succès. Les étudiants pourront obtenir un badge en le réussissant.');
      }

      onSave();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde du quiz:', error);
      // Si c'est une erreur de validation locale, afficher le message directement
      if (error.message && !error.response) {
        toast.error('Erreur de validation', error.message);
      } else {
        toast.errorFromApi('Erreur de sauvegarde', error, 'Erreur lors de la sauvegarde du quiz');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialQuiz?.id) return;

    setDeleting(true);
    try {
      await quizService.deleteModuleQuiz(moduleId);
      toast.success('Quiz supprimé', 'Le quiz du module a été supprimé avec succès');
      onSave(); // Recharger la liste
    } catch (error: any) {
      console.error('Erreur lors de la suppression du quiz:', error);
      toast.errorFromApi('Erreur de suppression', error, 'Erreur lors de la suppression du quiz');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const totalPoints = formData.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Quiz de Module</h2>
            <p className="text-purple-100">
              ⭐ Quiz optionnel - Les étudiants peuvent obtenir un badge en le réussissant
            </p>
          </div>
          <Award className="h-8 w-8" />
        </div>
      </div>

      {/* Formulaire principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Informations générales */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du quiz <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ex: Quiz de fin de module"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Description du quiz..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score minimum pour obtenir le badge (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.passing_score}
                onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration_minutes || ''}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Illimité"
              />
            </div>
          </div>
        </div>

        {/* Liste des questions */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
              <p className="text-sm text-gray-500">
                Total: {formData.questions.length} question(s) • {totalPoints} point(s)
              </p>
            </div>
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une question</span>
            </button>
          </div>

          {formData.questions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aucune question ajoutée</p>
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Ajouter la première question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.questions
                .sort((a, b) => a.order_index - b.order_index)
                .map((question, index) => (
                  <div key={question.id || `question-${question.order_index}-${index}`} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">Question {index + 1}</span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                            {question.question_type === 'multiple_choice' ? 'QCM' : 
                             question.question_type === 'true_false' ? 'Vrai/Faux' : 'Réponse courte'}
                          </span>
                          <span className="text-xs text-gray-500">{question.points} point(s)</span>
                        </div>
                        <p className="text-gray-700 mb-2">{question.question_text}</p>
                        {question.question_type === 'multiple_choice' && (
                          <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                            {(question.options || []).filter((o: string) => o && o.trim()).map((opt: string, optIdx: number) => (
                              <li key={optIdx} className={opt === question.correct_answer ? 'text-green-600 font-medium' : ''}>
                                {opt} {opt === question.correct_answer && '✓'}
                              </li>
                            ))}
                          </ul>
                        )}
                        {question.question_type === 'true_false' && (
                          <p className="text-sm text-gray-600">
                            Réponse correcte: <span className="font-medium text-green-600">{question.correct_answer}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FileQuestion className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.order_index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            {initialQuiz?.id && (
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting || saving}
                className="px-6 py-2 border border-red-300 rounded-lg text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Supprimer le quiz</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={saving || deleting}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting || formData.questions.length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sauvegarde...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Sauvegarder le quiz</span>
              </>
            )}
          </button>
          </div>
        </div>
      </div>

      {/* Modal d'ajout/édition de question (identique à EvaluationBuilder) */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingQuestion ? 'Modifier la question' : 'Nouvelle question'}
                </h3>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de question <span className="text-red-500">*</span>
                </label>
                <select
                  value={questionForm.question_type}
                  onChange={(e) => {
                    const newType = e.target.value as 'multiple_choice' | 'true_false' | 'short_answer';
                    setQuestionForm({
                      ...questionForm,
                      question_type: newType,
                      options: newType === 'multiple_choice' ? ['', '', '', ''] : [],
                      correct_answer: newType === 'true_false' ? 'true' : '',
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="multiple_choice">Question à choix multiples</option>
                  <option value="true_false">Vrai/Faux</option>
                  <option value="short_answer">Réponse courte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={questionForm.question_text}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Énoncé de la question..."
                  required
                />
              </div>

              {questionForm.question_type === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options <span className="text-red-500">*</span>
                  </label>
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={questionForm.correct_answer === opt}
                        onChange={() => setQuestionForm({ ...questionForm, correct_answer: opt })}
                        className="h-4 w-4 text-purple-600"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[idx] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOptions });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder={`Option ${idx + 1}`}
                      />
                      {questionForm.options.length > 2 && (
                        <button
                          onClick={() => {
                            const newOptions = questionForm.options.filter((_, i) => i !== idx);
                            setQuestionForm({ ...questionForm, options: newOptions });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {questionForm.options.length < 6 && (
                    <button
                      onClick={() => setQuestionForm({ ...questionForm, options: [...questionForm.options, ''] })}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      + Ajouter une option
                    </button>
                  )}
                </div>
              )}

              {questionForm.question_type === 'true_false' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Réponse correcte <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="true">Vrai</option>
                    <option value="false">Faux</option>
                  </select>
                </div>
              )}

              {questionForm.question_type === 'short_answer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Réponse correcte <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Réponse attendue..."
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={questionForm.points}
                  onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
              <button
                onClick={() => setShowQuestionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingQuestion ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer ce quiz ? Cette action est irréversible et les étudiants ne pourront plus le passer."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleting}
      />
    </div>
  );
}

