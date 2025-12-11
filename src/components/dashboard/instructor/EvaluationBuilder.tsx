'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertCircle, CheckCircle, Clock, Target, FileQuestion, X } from 'lucide-react';
import toast from '../../../lib/utils/toast';
import { evaluationService } from '../../../lib/services/evaluationService';

interface EvaluationQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[]; // Pour multiple_choice
  correct_answer: string;
  points: number;
  order_index: number;
}

interface Evaluation {
  id?: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  duration_minutes?: number;
  max_attempts: number;
  questions: EvaluationQuestion[];
}

interface EvaluationBuilderProps {
  courseId: string;
  initialEvaluation?: Evaluation;
  onSave: () => void;
  onCancel: () => void;
}

export default function EvaluationBuilder({
  courseId,
  initialEvaluation,
  onSave,
  onCancel,
}: EvaluationBuilderProps) {
  // Normaliser les questions pour s'assurer qu'elles ont le bon format
  const normalizeQuestions = React.useCallback((questions: any[]): EvaluationQuestion[] => {
    if (!questions || !Array.isArray(questions)) {
      return [];
    }
    
    return questions.map((q, idx) => {
      // Normaliser les options (peuvent être des objets ou des strings)
      let options: string[] = [];
      if (Array.isArray(q.options)) {
        options = q.options.map((opt: any) => typeof opt === 'string' ? opt : (opt.text || opt.label || opt.option || String(opt)));
      } else if (Array.isArray(q.answers)) {
        options = q.answers.map((ans: any) => typeof ans === 'string' ? ans : (ans.text || ans.label || ans.answer || String(ans)));
      }
      
      // Normaliser correct_answer pour les questions vrai/faux (comme dans QuizBuilder)
      let correctAnswer = q.correct_answer ?? q.correctAnswer ?? q.answer ?? '';
      const isTrueFalse = q.question_type === 'true_false' || q.questionType === 'true_false' || q.type === 'true_false';
      
      if (isTrueFalse) {
        // Convertir les booléens en strings "true"/"false"
        if (typeof correctAnswer === 'boolean') {
          correctAnswer = correctAnswer ? 'true' : 'false';
        } else {
          // S'assurer que c'est "true" ou "false" (string)
          const stringValue = String(correctAnswer).toLowerCase().trim();
          correctAnswer = (stringValue === 'true' || stringValue === '1') ? 'true' : 'false';
        }
      }

      return {
        id: q.id || q.questionId || `temp-${Date.now()}-${idx}-${Math.random()}`,
        question_text: q.question_text || q.questionText || q.question || '',
        question_type: (q.question_type || q.questionType || q.type || 'multiple_choice') as 'multiple_choice' | 'true_false' | 'short_answer',
        options: options,
        correct_answer: correctAnswer,
        points: typeof q.points === 'number' ? q.points : (typeof q.point === 'number' ? q.point : 1),
        order_index: q.order_index !== undefined ? q.order_index : (q.orderIndex !== undefined ? q.orderIndex : idx + 1),
      };
    });
  }, []);

  const [formData, setFormData] = useState<Omit<Evaluation, 'course_id'>>({
    title: initialEvaluation?.title || 'Évaluation finale',
    description: initialEvaluation?.description || '',
    passing_score: initialEvaluation?.passing_score || 70,
    duration_minutes: initialEvaluation?.duration_minutes,
    max_attempts: initialEvaluation?.max_attempts || 3,
    questions: normalizeQuestions(initialEvaluation?.questions || []),
  });

  // État pour suivre si l'utilisateur a fait des modifications locales
  const [hasLocalChanges, setHasLocalChanges] = useState(false);

  // Mettre à jour les questions quand initialEvaluation change
  // MAIS seulement si l'utilisateur n'a pas fait de modifications locales
  useEffect(() => {
    // Si l'utilisateur a fait des modifications locales, ne pas écraser avec initialEvaluation
    if (hasLocalChanges) {
      console.log('⚠️ [EvaluationBuilder] Modifications locales détectées, ne pas écraser avec initialEvaluation');
      return;
    }

    console.log('🔄 [EvaluationBuilder] initialEvaluation changé:', {
      hasEvaluation: !!initialEvaluation,
      hasQuestions: !!(initialEvaluation?.questions),
      questionsCount: initialEvaluation?.questions?.length || 0,
      questions: initialEvaluation?.questions?.map((q: any) => ({
        id: q.id,
        type: q.question_type || q.questionType || q.type,
        correct_answer: q.correct_answer ?? q.correctAnswer ?? q.answer,
        correct_answer_type: typeof (q.correct_answer ?? q.correctAnswer ?? q.answer)
      })),
    });
    
    if (initialEvaluation) {
      const normalizedQuestions = normalizeQuestions(initialEvaluation.questions || []);
      console.log('📝 [EvaluationBuilder] Mise à jour du formulaire avec', normalizedQuestions.length, 'questions');
      console.log('📝 [EvaluationBuilder] Questions normalisées:', normalizedQuestions.map(q => ({
        id: q.id,
        type: q.question_type,
        correct_answer: q.correct_answer,
        correct_answer_type: typeof q.correct_answer
      })));
      setFormData(prev => ({
        ...prev,
        title: initialEvaluation.title || prev.title,
        description: initialEvaluation.description || prev.description,
        passing_score: initialEvaluation.passing_score || prev.passing_score,
        duration_minutes: initialEvaluation.duration_minutes || prev.duration_minutes,
        max_attempts: initialEvaluation.max_attempts || prev.max_attempts,
        questions: normalizedQuestions,
      }));
      // Réinitialiser le flag après avoir chargé les données initiales
      setHasLocalChanges(false);
    }
  }, [initialEvaluation, normalizeQuestions, hasLocalChanges]);
  
  // Log pour vérifier l'état actuel des questions
  useEffect(() => {
    console.log('📊 [EvaluationBuilder] État actuel des questions:', {
      count: formData.questions.length,
      questions: formData.questions.map(q => ({
        id: q.id,
        text: q.question_text.substring(0, 30) + '...',
        type: q.question_type,
      })),
    });
  }, [formData.questions]);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<EvaluationQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState<Omit<EvaluationQuestion, 'order_index'>>({
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

  const handleEditQuestion = (question: EvaluationQuestion) => {
    setEditingQuestion(question);
    
    // Pour les questions vrai/faux, s'assurer que correct_answer est "true" ou "false" (string)
    let correctAnswer = question.correct_answer || '';
    if (question.question_type === 'true_false') {
      // Convertir en string et normaliser
      if (typeof correctAnswer === 'boolean') {
        correctAnswer = correctAnswer ? 'true' : 'false';
      } else {
        const stringValue = String(correctAnswer).toLowerCase().trim();
        correctAnswer = (stringValue === 'true' || stringValue === '1') ? 'true' : 'false';
      }
    }
    
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options || ['', '', '', ''],
      correct_answer: correctAnswer,
      points: question.points,
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = () => {
    if (!questionForm.question_text || !questionForm.correct_answer) {
      toast.warning('Formulaire incomplet', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (questionForm.question_type === 'multiple_choice' && questionForm.options.filter(o => o.trim()).length < 2) {
      toast.warning('Options insuffisantes', 'Veuillez fournir au moins 2 options pour une question à choix multiples');
      return;
    }

    // Pour les questions vrai/faux, s'assurer que correct_answer est "true" ou "false" (string)
    // Comme dans QuizBuilder, on utilise directement la valeur du formulaire
    let finalCorrectAnswer = questionForm.correct_answer;
    if (questionForm.question_type === 'true_false') {
      // Les radio buttons garantissent déjà "true" ou "false", mais on vérifie quand même
      if (finalCorrectAnswer !== 'true' && finalCorrectAnswer !== 'false') {
        // Si ce n'est pas déjà "true" ou "false", convertir
        if (typeof finalCorrectAnswer === 'boolean') {
          finalCorrectAnswer = finalCorrectAnswer ? 'true' : 'false';
        } else {
          const stringValue = String(finalCorrectAnswer).toLowerCase().trim();
          finalCorrectAnswer = (stringValue === 'true' || stringValue === '1') ? 'true' : 'false';
        }
      }
    }

    const newQuestion: EvaluationQuestion = {
      ...questionForm,
      correct_answer: finalCorrectAnswer,
      id: editingQuestion?.id || `temp-${Date.now()}-${Math.random()}`,
      order_index: editingQuestion 
        ? editingQuestion.order_index 
        : formData.questions.length + 1,
    };

    if (editingQuestion) {
      setFormData({
        ...formData,
        questions: formData.questions.map(q => 
          q.id === editingQuestion.id ? newQuestion : q
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
    
    // Marquer qu'il y a des modifications locales
    setHasLocalChanges(true);
  };

  const handleDeleteQuestion = (questionId: string | undefined, orderIndex: number) => {
    console.log('[EvaluationBuilder] 🗑️ Suppression question:', {
      questionId,
      orderIndex,
      questionsAvant: formData.questions.length,
      questionToDelete: formData.questions.find(q => q.id === questionId || q.order_index === orderIndex)
    });
    
    const updatedQuestions = formData.questions
      .filter(q => q.id !== questionId && q.order_index !== orderIndex)
      .map((q, idx) => ({ ...q, order_index: idx + 1 }));
    
    console.log('[EvaluationBuilder] ✅ Questions après suppression:', {
      questionsApres: updatedQuestions.length,
      questions: updatedQuestions.map(q => ({
        id: q.id,
        type: q.question_type,
        order_index: q.order_index
      }))
    });
    
    setFormData({
      ...formData,
      questions: updatedQuestions,
    });
    
    // Marquer qu'il y a des modifications locales
    setHasLocalChanges(true);
  };

  const handleSave = async () => {
    if (!formData.title || formData.questions.length === 0) {
      toast.warning('Formulaire incomplet', 'Veuillez ajouter au moins une question à l\'évaluation');
      return;
    }

    setSaving(true);
    try {
      // Normaliser les questions vrai/faux avant l'envoi (similaire à QuizBuilder)
      const normalizedQuestions = formData.questions.map(q => {
        if (q.question_type === 'true_false') {
          // S'assurer que correct_answer est "true" ou "false" (string)
          let normalizedAnswer = q.correct_answer;
          if (typeof normalizedAnswer === 'boolean') {
            normalizedAnswer = normalizedAnswer ? 'true' : 'false';
          } else {
            const stringValue = String(normalizedAnswer).toLowerCase().trim();
            normalizedAnswer = (stringValue === 'true' || stringValue === '1') ? 'true' : 'false';
          }
          return {
            ...q,
            correct_answer: normalizedAnswer
          };
        }
        return q;
      });

      const evaluationData = {
        course_id: courseId,
        title: formData.title,
        description: formData.description,
        passing_score: formData.passing_score,
        duration_minutes: formData.duration_minutes,
        max_attempts: formData.max_attempts,
        questions: normalizedQuestions, // Utiliser les questions finales vérifiées
      };
      
      // Log du JSON qui sera envoyé pour vérifier la sérialisation
      const jsonPayload = JSON.stringify(evaluationData);
      console.log('[EvaluationBuilder] 📦 JSON payload complet:', jsonPayload);
      const parsedPayload = JSON.parse(jsonPayload);
      console.log('[EvaluationBuilder] 🔍 Questions dans le JSON parsé:', parsedPayload.questions?.map((q: any) => ({
        id: q.id,
        type: q.question_type,
        correct_answer: q.correct_answer,
        correct_answer_type: typeof q.correct_answer
      })));

      let savedEvaluation: any;
      if (initialEvaluation?.id) {
        savedEvaluation = await evaluationService.updateEvaluation(initialEvaluation.id, evaluationData);
        console.log('[EvaluationBuilder] ✅ Évaluation mise à jour, réponse backend:', {
          questions: savedEvaluation?.questions?.map((q: any) => ({
            id: q.id,
            type: q.question_type || q.questionType || q.type,
            correct_answer: q.correct_answer ?? q.correctAnswer ?? q.answer,
            correct_answer_type: typeof (q.correct_answer ?? q.correctAnswer ?? q.answer)
          }))
        });
        toast.success('Évaluation mise à jour', 'L\'évaluation finale a été mise à jour avec succès');
      } else {
        savedEvaluation = await evaluationService.createEvaluation(evaluationData);
        console.log('[EvaluationBuilder] ✅ Évaluation créée, réponse backend:', {
          questions: savedEvaluation?.questions?.map((q: any) => ({
            id: q.id,
            type: q.question_type || q.questionType || q.type,
            correct_answer: q.correct_answer ?? q.correctAnswer ?? q.answer,
            correct_answer_type: typeof (q.correct_answer ?? q.correctAnswer ?? q.answer)
          }))
        });
        toast.success('Évaluation créée', 'L\'évaluation finale a été créée avec succès');
      }

      // Réinitialiser le flag de modifications locales après sauvegarde réussie
      setHasLocalChanges(false);
      onSave();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde de l\'évaluation:', error);
      toast.error('Erreur', error.message || 'Erreur lors de la sauvegarde de l\'évaluation');
    } finally {
      setSaving(false);
    }
  };

  const totalPoints = formData.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Évaluation Finale</h2>
            <p className="text-blue-100">
              ⚠️ Cette évaluation est obligatoire pour permettre aux utilisateurs d'obtenir un certificat
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire principal */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Informations générales */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de l'évaluation <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Évaluation finale du cours"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Description de l'évaluation..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score minimum requis (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.passing_score}
                onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Illimité"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de tentatives <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_attempts}
                onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {question.question_type === 'multiple_choice' ? 'QCM' : 
                             question.question_type === 'true_false' ? 'Vrai/Faux' : 'Réponse courte'}
                          </span>
                          <span className="text-xs text-gray-500">{question.points} point(s)</span>
                        </div>
                        <p className="text-gray-700 mb-2">{question.question_text}</p>
                        {question.question_type === 'multiple_choice' && (
                          <ul className="list-disc list-inside text-sm text-gray-600 ml-4">
                            {question.options.filter(o => o.trim()).map((opt, optIdx) => (
                              <li key={optIdx} className={opt === question.correct_answer ? 'text-green-600 font-medium' : ''}>
                                {opt} {opt === question.correct_answer && '✓'}
                              </li>
                            ))}
                          </ul>
                        )}
                        {question.question_type === 'true_false' && (
                          <p className="text-sm text-gray-600">
                            Réponse correcte: <span className="font-medium text-green-600">
                              {(() => {
                                const answer = question.correct_answer;
                                console.log('[EvaluationBuilder] 🎨 Affichage réponse correcte:', {
                                  questionId: question.id,
                                  correct_answer: answer,
                                  correct_answer_type: typeof answer,
                                  willDisplay: answer
                                });
                                return answer;
                              })()}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FileQuestion className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id, question.order_index)}
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
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || formData.questions.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sauvegarde...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Sauvegarder l'évaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal d'ajout/édition de question */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="h-4 w-4 text-blue-600"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options];
                          newOptions[idx] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOptions });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="text-sm text-blue-600 hover:text-blue-700"
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
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="correct_answer_tf"
                        value="true"
                        checked={questionForm.correct_answer === 'true'}
                        onChange={() => setQuestionForm({ ...questionForm, correct_answer: 'true' })}
                        className="w-4 h-4 text-green-500 focus:ring-green-500"
                      />
                      <span className="text-green-700 font-medium">Vrai</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="correct_answer_tf"
                        value="false"
                        checked={questionForm.correct_answer === 'false'}
                        onChange={() => setQuestionForm({ ...questionForm, correct_answer: 'false' })}
                        className="w-4 h-4 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-red-700 font-medium">Faux</span>
                    </label>
                  </div>
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingQuestion ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

