'use client';

import React, { useMemo, useState } from 'react';
import { Eye, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';
import { courseService } from '../../lib/services/courseService';
import { useNotification } from '../../lib/hooks/useNotification';
import type { Lesson } from '../../types';

type LegacyLesson = Lesson & {
  contentType?: string;
  contentUrl?: string;
  contentText?: string;
  isRequired?: boolean;
};

interface LessonEditorProps {
  courseId: number | string;
  lesson: LegacyLesson;
  onSaved?: (updated: Lesson) => void;
}

export default function LessonEditor({ courseId, lesson, onSaved }: LessonEditorProps) {
  const [contentType, setContentType] = useState<string>(lesson.content_type || (lesson.contentType as any) || 'text');
  const [contentUrl, setContentUrl] = useState<string>(lesson.content_url || (lesson.contentUrl as any) || '');
  const [contentText, setContentText] = useState<string>(lesson.content_text || (lesson.contentText as any) || '');
  const [isRequired, setIsRequired] = useState<boolean>(lesson.is_required ?? (lesson.isRequired as any) ?? true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useNotification() as any;

  const handleSave = async () => {
    // Validation
    if ((contentType !== 'text') && !contentUrl) {
      error?.('Validation', 'URL requise pour ce type de contenu');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        content_type: contentType,
        content_url: contentUrl || undefined,
        content_text: contentText || undefined,
        is_required: isRequired,
      };
      const updated = await courseService.updateLesson(courseId, String(lesson.id), payload);
      onSaved?.(updated as any);
      success?.('Leçon enregistrée');
    } finally {
      setSaving(false);
    }
  };

  const previewContent = useMemo(() => {
    if (contentType === 'text') {
      if (!contentText?.trim()) {
        return <p className="text-sm text-gray-500">Rédigez du contenu pour afficher un aperçu.</p>;
      }
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: contentText }}
        />
      );
    }

    if (!contentUrl) {
      return <p className="text-sm text-gray-500">Ajoutez une URL pour prévisualiser ce contenu.</p>;
    }

    if (contentType === 'video') {
      return (
        <div className="space-y-2">
          <div className="aspect-video bg-black/5 rounded-lg overflow-hidden">
            <iframe
              src={contentUrl}
              title="Prévisualisation vidéo"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          <a href={contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-mdsc-blue-primary">
            <ExternalLink className="h-4 w-4 mr-1" /> Ouvrir la vidéo dans un nouvel onglet
          </a>
        </div>
      );
    }

    if (contentType === 'audio') {
      return (
        <div className="space-y-2">
          <audio controls className="w-full">
            <source src={contentUrl} />
            Votre navigateur ne prend pas en charge l'élément audio.
          </audio>
          <a href={contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-mdsc-blue-primary">
            <ExternalLink className="h-4 w-4 mr-1" /> Ouvrir l'audio dans un nouvel onglet
          </a>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <a href={contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-mdsc-blue-primary">
          <ExternalLink className="h-4 w-4 mr-1" /> Ouvrir la ressource ({contentType})
        </a>
        <div className="rounded border border-dashed border-gray-200 p-3 text-xs text-gray-500">
          L'aperçu intégré n'est pas disponible pour ce type de contenu. Le lien ci-dessus ouvrira la ressource.
        </div>
      </div>
    );
  }, [contentType, contentText, contentUrl]);

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Type de contenu</label>
          <select value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
            {['video','text','document','audio','presentation','h5p','quiz'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Obligatoire</label>
          <select value={isRequired ? 'yes' : 'no'} onChange={(e) => setIsRequired(e.target.value === 'yes')} className="w-full border rounded px-3 py-2 text-sm">
            <option value="yes">Oui</option>
            <option value="no">Non</option>
          </select>
        </div>
      </div>

      {(contentType === 'video' || contentType === 'document' || contentType === 'audio' || contentType === 'presentation' || contentType === 'h5p') && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">URL du contenu</label>
          <input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" placeholder="https://..." />
        </div>
      )}

      {contentType === 'text' && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">Contenu texte (HTML)</label>
          <textarea value={contentText} onChange={(e) => setContentText(e.target.value)} rows={6} className="w-full border rounded px-3 py-2 text-sm" />
        </div>
      )}

      <div className="border border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center space-x-2 mb-3">
          <Eye className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-700">Aperçu du contenu</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          {previewContent}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}


