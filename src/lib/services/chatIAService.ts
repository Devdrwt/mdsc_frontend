// Service pour l'intégration avec l'IA (ChatGPT/OpenAI)

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: ChatContext;
}

export interface ChatContext {
  courseId?: string;
  moduleId?: string;
  userId: string;
  userRole: 'student' | 'instructor' | 'admin';
}

export interface CourseSummary {
  courseId: string;
  moduleId: string;
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  generatedAt: Date;
}

export interface CourseRecommendation {
  courseId: string;
  title: string;
  description: string;
  reason: string;
  confidence: number;
  category: string;
}

export interface SearchResult {
  id: string;
  type: 'course' | 'module' | 'quiz' | 'assignment';
  title: string;
  content: string;
  relevance: number;
  courseId?: string;
  moduleId?: string;
}

class ChatIAService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not configured. Chat IA features will not work.');
    }
  }

  // Envoyer un message à l'IA
  async sendMessage(message: string, context: ChatContext): Promise<ChatMessage> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY environment variable.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(context),
            },
            {
              role: 'user',
              content: message,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur HTTP: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      return {
        id: this.generateId(),
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
        context,
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }

  // Générer un résumé de cours
  async generateCourseSummary(courseId: string, moduleId: string, content: string): Promise<CourseSummary> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant pédagogique spécialisé dans la création de résumés de cours. Tu dois créer des résumés clairs, structurés et utiles pour les apprenants.',
            },
            {
              role: 'user',
              content: `Crée un résumé du contenu suivant du cours ${courseId}, module ${moduleId}:\n\n${content}\n\nLe résumé doit inclure:\n1. Un résumé général\n2. Les points clés (liste)\n3. Des recommandations pour approfondir`,
            },
          ],
          max_tokens: 800,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      const summaryContent = data.choices[0].message.content;

      // Parser le contenu pour extraire les sections
      const sections = this.parseSummaryContent(summaryContent);

      return {
        courseId,
        moduleId,
        summary: sections.summary,
        keyPoints: sections.keyPoints,
        recommendations: sections.recommendations,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Erreur lors de la génération du résumé:', error);
      throw error;
    }
  }

  // Obtenir des recommandations de cours
  async getCourseRecommendations(userId: string, userRole: string, completedCourses: string[]): Promise<CourseRecommendation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Tu es un conseiller pédagogique spécialisé dans les recommandations de cours. Tu dois suggérer des cours pertinents basés sur le profil et l\'historique de l\'utilisateur.',
            },
            {
              role: 'user',
              content: `Utilisateur: ${userId}, Rôle: ${userRole}\nCours complétés: ${completedCourses.join(', ')}\n\nSuggère 3 cours pertinents avec une explication pour chaque recommandation.`,
            },
          ],
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      const recommendationsContent = data.choices[0].message.content;

      // Parser les recommandations
      return this.parseRecommendations(recommendationsContent);
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      return [];
    }
  }

  // Recherche intelligente dans le contenu
  async searchContent(query: string, context: ChatContext): Promise<SearchResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant de recherche spécialisé dans l\'éducation. Tu dois aider à trouver du contenu pertinent dans les cours et modules.',
            },
            {
              role: 'user',
              content: `Recherche: "${query}"\nContexte: ${context.userRole}, Cours: ${context.courseId || 'Tous'}\n\nFournis des résultats pertinents avec des explications.`,
            },
          ],
          max_tokens: 500,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      const searchContent = data.choices[0].message.content;

      // Parser les résultats de recherche
      return this.parseSearchResults(searchContent, query);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      return [];
    }
  }

  // Obtenir le prompt système selon le contexte
  private getSystemPrompt(context: ChatContext): string {
    const basePrompt = 'Tu es un assistant pédagogique intelligent pour la plateforme MdSC (Maison de la Société Civile). Tu aides les utilisateurs dans leur apprentissage.';

    switch (context.userRole) {
      case 'student':
        return `${basePrompt} Tu es spécialisé dans l'aide aux apprenants. Tu peux expliquer les concepts, aider avec les exercices, et fournir des conseils d'apprentissage.`;
      
      case 'instructor':
        return `${basePrompt} Tu es spécialisé dans l'aide aux formateurs. Tu peux aider à créer du contenu, suggérer des activités pédagogiques, et fournir des conseils d'enseignement.`;
      
      case 'admin':
        return `${basePrompt} Tu es spécialisé dans l'aide aux administrateurs. Tu peux aider avec la gestion de la plateforme, les statistiques, et les configurations.`;
      
      default:
        return basePrompt;
    }
  }

  // Parser le contenu du résumé
  private parseSummaryContent(content: string): { summary: string; keyPoints: string[]; recommendations: string[] } {
    const lines = content.split('\n').filter(line => line.trim());
    
    let summary = '';
    const keyPoints: string[] = [];
    const recommendations: string[] = [];
    
    let currentSection = 'summary';
    
    for (const line of lines) {
      if (line.toLowerCase().includes('points clés') || line.toLowerCase().includes('key points')) {
        currentSection = 'keyPoints';
        continue;
      }
      if (line.toLowerCase().includes('recommandations') || line.toLowerCase().includes('recommendations')) {
        currentSection = 'recommendations';
        continue;
      }
      
      if (currentSection === 'summary') {
        summary += line + '\n';
      } else if (currentSection === 'keyPoints' && line.startsWith('-')) {
        keyPoints.push(line.substring(1).trim());
      } else if (currentSection === 'recommendations' && line.startsWith('-')) {
        recommendations.push(line.substring(1).trim());
      }
    }
    
    return {
      summary: summary.trim(),
      keyPoints,
      recommendations,
    };
  }

  // Parser les recommandations
  private parseRecommendations(content: string): CourseRecommendation[] {
    // Implémentation simplifiée - dans un vrai projet, on utiliserait une API de cours
    const recommendations: CourseRecommendation[] = [];
    
    // Exemple de parsing basique
    const lines = content.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Cours') || line.includes('Formation')) {
        recommendations.push({
          courseId: `course-${i}`,
          title: line,
          description: lines[i + 1] || '',
          reason: lines[i + 2] || '',
          confidence: 0.8,
          category: 'Recommandé',
        });
      }
    }
    
    return recommendations;
  }

  // Parser les résultats de recherche
  private parseSearchResults(content: string, query: string): SearchResult[] {
    const results: SearchResult[] = [];
    
    // Implémentation simplifiée
    results.push({
      id: 'search-1',
      type: 'course',
      title: `Résultat pour "${query}"`,
      content: content.substring(0, 200) + '...',
      relevance: 0.9,
    });
    
    return results;
  }

  // Générer un ID unique
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const chatIAService = new ChatIAService();
