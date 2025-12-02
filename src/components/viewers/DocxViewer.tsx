'use client';

import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle } from 'lucide-react';

interface DocxViewerProps {
  url: string;
  filename?: string;
}

export default function DocxViewer({ url, filename }: DocxViewerProps) {
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      setError(false);

      try {
        // Import dynamique de mammoth pour le navigateur
        const mammoth = await import('mammoth');
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du fichier');
        }

        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.default.convertToHtml({ arrayBuffer });
        
        setHtml(result.value);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Erreur lors du chargement du document DOCX:', err);
        setError(true);
        setIsLoading(false);
      }
    };

    if (url) {
      loadDocument();
    }
  }, [url]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 min-h-[600px]">
        <Loader className="h-8 w-8 animate-spin text-mdsc-blue-primary mb-4" />
        <p className="text-sm text-gray-600">Chargement du document Word...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 min-h-[600px]">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium mb-2">Impossible d'afficher le document</p>
        <p className="text-sm text-gray-500">Veuillez réessayer plus tard</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-white p-8">
      <div
        className="prose prose-lg max-w-none
          prose-headings:text-gray-900 prose-headings:font-bold
          prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6
          prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-5
          prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
          prose-a:text-mdsc-blue-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-ul:text-gray-700 prose-ul:my-4 prose-ul:pl-6
          prose-ol:text-gray-700 prose-ol:my-4 prose-ol:pl-6
          prose-li:text-gray-700 prose-li:my-2 prose-li:leading-relaxed
          prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6 prose-img:max-w-full prose-img:h-auto
          prose-blockquote:border-l-4 prose-blockquote:border-mdsc-blue-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:my-4
          prose-table:w-full prose-table:my-4 prose-table:border-collapse
          prose-th:bg-gray-100 prose-th:border prose-th:border-gray-300 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
          prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

