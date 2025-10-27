'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Video, FileQuestion, Image, Plus, Edit, Trash2, Search, GripVertical, CheckCircle, Clock, FileVideo } from 'lucide-react';
import { ProfessionalService, SequenceContent } from '../../../lib/services/professionalService';

interface Props {
  sequenceId: number;
}

export default function SequenceContentManagement({ sequenceId }: Props) {
  const [contents, setContents] = useState<SequenceContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContents();
  }, [sequenceId]);

  const loadContents = async () => {
    try {
      const data = await ProfessionalService.getSequenceContents(sequenceId);
      setContents(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contenus de la Séquence</h2>
        <button className="btn-mdsc-primary">
          <Plus className="h-5 w-5 mr-2" />
          Ajouter un contenu
        </button>
      </div>

      {contents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">Aucun contenu</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contents.map((content) => (
                <tr key={content.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{content.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">Modifier</button>
                    <button className="text-red-600 hover:text-red-900">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
