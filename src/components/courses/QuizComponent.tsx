'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Trophy, FileQuestion, Target } from 'lucide-react';
import { quizService } from '../../lib/services/quizService';
import { Quiz, QuizQuestion, QuizAttempt } from '../../types/course';
import Button from '../ui/Button';

interface QuizComponentProps {
  quizId: string;
  lessonId: string;
  onComplete?: (attempt: QuizAttempt) => void;
  quizType?: 'formative' | 'assessment';
  className?: string;
}

export default function QuizComponent({
  quizId,
  lessonId,
  onComplete,
  quizType = 'formative',
  className = '',
}: QuizComponentProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<{ [questionId: string]: string | string[] }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<QuizAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (quiz && quiz.timeLimit && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        const remaining = quiz.timeLimit! - elapsed;
        setTimeRemaining(remaining > 0 ? remaining : 0);
        
        if (remaining <= 0) {
          handleAutoSubmit();
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quiz, startTime]);

  const loadQuiz = async () => {
    try {
      // Utiliser getQuizForStudent si quizId est disponible, sinon essayer via lessonId
      if (quizId) {
        const moduleQuiz = await quizService.getQuizForStudent(quizId);
        console.log('📚 [QuizComponent] Quiz chargé:', moduleQuiz);
        console.log('📚 [QuizComponent] Questions reçues:', moduleQuiz.questions);
        // Convertir ModuleQuiz en Quiz pour compatibilité
        const quizData: Quiz = {
          id: Number(moduleQuiz.id || quizId),
          course_id: Number(moduleQuiz.course_id),
          lesson_id: Number(lessonId),
          title: moduleQuiz.title,
          description: moduleQuiz.description || '',
          passing_score: moduleQuiz.passing_score,
          max_attempts: 3,
          time_limit_minutes: moduleQuiz.duration_minutes,
          is_final: false,
          is_published: true,
          created_at: new Date().toISOString(),
          question_count: moduleQuiz.questions?.length || 0,
          invalid_questions_count: (moduleQuiz as any).invalid_questions_count || 0,
        };
        setQuiz(quizData);
        // Convertir les questions et filtrer les invalides selon les recommandations
        const convertedQuestions: QuizQuestion[] = (moduleQuiz.questions || []).map((q, idx) => {
          const questionData = q as any; // Pour accéder aux propriétés optionnelles du backend
          return {
            id: Number(q.id || idx + 1),
            quiz_id: Number(moduleQuiz.id || quizId),
            question: q.question_text || '',
            question_type: q.question_type || 'multiple_choice',
            options: q.options || [],
            correct_answer: q.correct_answer,
            points: q.points || 1,
            order_index: q.order_index || idx + 1,
            // Propriétés de validation du backend
            is_valid: questionData.is_valid !== false, // Par défaut true sauf si explicitement false
            has_options: (q.options && q.options.length > 0) || questionData.has_options === true,
          };
        });
        
        // Filtrer les questions invalides selon les recommandations
        const validQuestions = convertedQuestions.filter(q => {
          // Vérifier is_valid si disponible
          if (q.is_valid === false) {
            console.warn(`⚠️ [QuizComponent] Question ${q.id} invalide (is_valid=false)`);
            return false;
          }
          
          // Pour QCM et Vrai/Faux, vérifier qu'il y a des options
          if (
            (q.question_type === 'multiple_choice' || q.question_type === 'true_false' || q.question_type === 'multiple_select') &&
            (!q.options || q.options.length === 0)
          ) {
            console.warn(`⚠️ [QuizComponent] Question ${q.id} sans options (type: ${q.question_type})`);
            return false;
          }
          
          return true;
        });
        
        console.log('📝 [QuizComponent] Questions converties:', convertedQuestions);
        console.log('✅ [QuizComponent] Questions valides:', validQuestions);
        
        // Afficher un avertissement si des questions sont invalides
        const invalidCount = convertedQuestions.length - validQuestions.length;
        if (invalidCount > 0) {
          console.warn(`⚠️ [QuizComponent] ${invalidCount} question(s) invalide(s) exclue(s) du quiz`);
        }
        
        // Mettre à jour le quiz avec le nombre de questions invalides
        quizData.invalid_questions_count = invalidCount;
        
        if (validQuestions.length === 0) {
          setError('Ce quiz ne contient aucune question valide.');
          return;
        }
        
        setQuestions(validQuestions);
        setStartTime(new Date());
      } else {
        // Si pas de quizId, essayer de récupérer via lessonId (nécessite un endpoint backend)
        setError('Quiz ID requis pour charger le quiz');
      }
    } catch (err: any) {
      console.error('❌ [QuizComponent] Erreur lors du chargement:', err);
      setError(err.message || 'Erreur lors du chargement du quiz');
    }
  };

  const handleAnswerChange = (questionId: string | number, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Validation avant soumission selon les recommandations
  const canSubmitQuiz = (): { valid: boolean; reason?: string } => {
    if (!questions || questions.length === 0) {
      return { valid: false, reason: 'Aucune question dans le quiz' };
    }
    
    const invalidQuestions = questions.filter(q => q.is_valid === false);
    if (invalidQuestions.length > 0) {
      return { 
        valid: false, 
        reason: `${invalidQuestions.length} question(s) invalide(s) dans le quiz` 
      };
    }
    
    return { valid: true };
  };

  const handleSubmit = async () => {
    // Valider avant soumission
    const validation = canSubmitQuiz();
    if (!validation.valid) {
      setError(validation.reason || 'Impossible de soumettre le quiz');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Utiliser submitQuiz avec le format attendu
      const result = await quizService.submitQuiz({
        quiz_id: quizId,
        answers: answers as Record<string, string>,
      });
      
      // Convertir QuizResult en QuizAttempt
      const attempt: QuizAttempt = {
        id: Date.now(),
        user_id: 0,
        quiz_id: Number(quizId),
        answers: answers as Record<string, any>,
        score: result.score,
        total_points: result.total_points,
        percentage: result.percentage,
        is_passed: result.passed,
        completed_at: new Date().toISOString(),
      };
      
      setAttemptResult(attempt);
      onComplete?.(attempt);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la soumission du quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    if (Object.keys(answers).length > 0) {
      handleSubmit();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-500">Chargement du quiz...</p>
      </div>
    );
  }

  if (attemptResult) {
    const score = attemptResult.score;
    const passed = score >= quiz.passingScore;
    
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center space-y-4">
          {passed ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          )}
          
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {passed ? 'Félicitations !' : 'Quiz non réussi'}
            </h3>
            <p className="text-gray-600">
              Vous avez obtenu {score}% (minimum requis: {quiz.passingScore}%)
            </p>
          </div>

          <div className="flex justify-center items-center space-x-4 pt-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Score</p>
              <p className="text-2xl font-bold text-mdsc-blue-primary">{score}%</p>
            </div>
            {attemptResult.timeSpent && (
              <div className="text-center">
                <p className="text-sm text-gray-500">Temps</p>
                <p className="text-2xl font-bold text-gray-700">
                  {formatTime(attemptResult.timeSpent)}
                </p>
              </div>
            )}
          </div>

          {passed && attemptResult.badgesEarned && attemptResult.badgesEarned.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Badges obtenus:</p>
              <div className="flex justify-center space-x-2">
                {attemptResult.badgesEarned.map((badge) => (
                  <div key={badge.id} className="flex items-center space-x-1 text-mdsc-gold">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-medium">{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <p>Aucune question disponible pour ce quiz.</p>
        </div>
      </div>
    );
  }
  
  const isAnswered = currentQuestion.id in answers;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const isFormative = quizType === 'formative';
  
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Avertissement si des questions sont invalides */}
      {quiz.invalid_questions_count && quiz.invalid_questions_count > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                {quiz.invalid_questions_count} question(s) invalide(s) {quiz.invalid_questions_count === 1 ? 'a été exclue' : 'ont été exclues'} du quiz.
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Veuillez contacter l'administrateur si vous pensez qu'il s'agit d'une erreur.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
            {isFormative ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center space-x-1">
                <FileQuestion className="h-3 w-3" />
                <span>Formatif</span>
              </span>
            ) : (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center space-x-1">
                <Target className="h-3 w-3" />
                <span>Évaluation</span>
              </span>
            )}
          </div>
          {timeRemaining !== null && (
            <div className="flex items-center space-x-2 text-mdsc-blue-primary">
              <Clock className="h-5 w-5" />
              <span className="font-medium">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        {!isFormative && quiz.is_final && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
            <p className="text-sm text-purple-800 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>Ce quiz est obligatoire pour obtenir le certificat. Score minimum requis : {quiz.passingScore}%</span>
            </p>
          </div>
        )}
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-mdsc-blue-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Question {currentQuestionIndex + 1} sur {questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="text-lg font-medium text-gray-900 mb-4">
          {currentQuestion.question}
        </p>

        <div className="space-y-3">
          {currentQuestion.question_type === 'multiple_choice' ? (
            currentQuestion.options?.map((option, index) => {
              const optionValue = String.fromCharCode(65 + index); // A, B, C, D
              const isSelected = answers[currentQuestion.id] === optionValue;
              
              return (
                <label
                  key={index}
                  className={`
                    flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-mdsc-blue-primary bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={optionValue}
                    checked={isSelected}
                    onChange={() => handleAnswerChange(currentQuestion.id, optionValue)}
                    className="w-4 h-4 text-mdsc-blue-primary"
                  />
                  <span className="flex-1 text-gray-700">{option}</span>
                </label>
              );
            })
          ) : currentQuestion.question_type === 'multiple_select' ? (
            currentQuestion.options?.map((option, index) => {
              const optionValue = String.fromCharCode(65 + index);
              const selectedAnswers = (answers[currentQuestion.id] as string[]) || [];
              const isSelected = selectedAnswers.includes(optionValue);
              
              return (
                <label
                  key={index}
                  className={`
                    flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-mdsc-blue-primary bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newAnswers = isSelected
                        ? selectedAnswers.filter(a => a !== optionValue)
                        : [...selectedAnswers, optionValue];
                      handleAnswerChange(currentQuestion.id, newAnswers);
                    }}
                    className="w-4 h-4 text-mdsc-blue-primary"
                  />
                  <span className="flex-1 text-gray-700">{option}</span>
                </label>
              );
            })
          ) : (
            <textarea
              value={(answers[currentQuestion.id] as string) || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Votre réponse..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
              rows={5}
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Précédent
        </Button>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !isAnswered}
          >
            {isSubmitting ? 'Soumission...' : 'Soumettre le quiz'}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!isAnswered}
          >
            Suivant
          </Button>
        )}
      </div>
    </div>
  );
}
