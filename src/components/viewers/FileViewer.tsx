'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader, AlertCircle, ExternalLink } from 'lucide-react';

// Import dynamique des viewers pour éviter le SSR
// Les spinners de chargement sont gérés par les viewers individuels, pas besoin d'en ajouter ici
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
});

const PptxViewer = dynamic(() => import('./PptxViewer'), {
  ssr: false,
});

const DocxViewer = dynamic(() => import('./DocxViewer'), {
  ssr: false,
});

const XlsxViewer = dynamic(() => import('./XlsxViewer'), {
  ssr: false,
});

interface FileViewerProps {
  fileUrl: string;
  fileType?: string;
  filename?: string;
}

/**
 * Composant universel de visualisation de fichiers
 * Détecte automatiquement le type de fichier et affiche le viewer approprié
 */
export default function FileViewer({ fileUrl, fileType, filename }: FileViewerProps) {
  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 min-h-[600px]">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium mb-2">Aucun fichier à afficher</p>
      </div>
    );
  }

  // Déterminer le type de fichier
  const getFileType = (): string => {
    // Utiliser le fileType fourni si disponible
    if (fileType) {
      if (fileType.includes('pdf')) return 'pdf';
      if (fileType.includes('presentation') || fileType.includes('powerpoint')) return 'pptx';
      if (fileType.includes('word') || fileType.includes('document')) return 'docx';
      if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'xlsx';
    }

    // Sinon, détecter depuis l'URL ou le nom de fichier
    const name = (filename || fileUrl).toLowerCase();
    
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.pptx') || name.endsWith('.ppt')) return 'pptx';
    if (name.endsWith('.docx') || name.endsWith('.doc')) return 'docx';
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'xlsx';
    
    return 'unknown';
  };

  const detectedType = getFileType();

  // Afficher le viewer approprié
  switch (detectedType) {
    case 'pdf':
      return <PdfViewer url={fileUrl} filename={filename} />;

    case 'pptx':
      return <PptxViewer url={fileUrl} filename={filename} />;

    case 'docx':
      return <DocxViewer url={fileUrl} filename={filename} />;

    case 'xlsx':
      return <XlsxViewer url={fileUrl} filename={filename} />;

    default:
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 min-h-[600px]">
          <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium mb-2">
            Format de fichier non supporté
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Ce type de fichier ne peut pas être prévisualisé dans le navigateur.
          </p>
          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-mdsc-blue-primary text-white rounded-lg hover:bg-mdsc-blue-dark transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            Télécharger le fichier
          </a>
        </div>
      );
  }
}

