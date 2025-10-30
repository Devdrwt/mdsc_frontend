'use client';

import React, { useState } from 'react';
import { Lesson } from '../../types/course';
import Button from '../ui/Button';
import { courseService } from '../../lib/services/courseService';
import { useNotification } from '../../lib/hooks/useNotification';

interface LessonEditorProps {
  courseId: number | string;
  lesson: Lesson;
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

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}


