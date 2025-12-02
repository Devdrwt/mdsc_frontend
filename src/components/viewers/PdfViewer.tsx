'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Loader, AlertCircle } from 'lucide-react';

// Configurer le worker PDF.js avec préchargement
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs-worker/pdf.worker.min.mjs';
  
  // Précharger le worker pour améliorer les performances
  const preloadWorker = async () => {
    try {
      const workerUrl = pdfjs.GlobalWorkerOptions.workerSrc;
      await fetch(workerUrl, { method: 'HEAD' });
    } catch (error) {
      console.warn('Impossible de précharger le worker PDF.js:', error);
    }
  };
  
  // Précharger le worker dès que possible
  if (document.readyState === 'complete') {
    preloadWorker();
  } else {
    window.addEventListener('load', preloadWorker);
  }
}

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export default function PdfViewer({ url, filename }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const scale = 0.7; // Fixé à 70% comme demandé
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const documentRef = useRef<any>(null);

  useEffect(() => {
    setIsLoading(true);
    setIsLoadingPage(true);
    setError(false);
    setLoadingProgress(0);
    setNumPages(null);
    setPageNumber(1);
  }, [url]);

  // Fonction pour gérer le chargement progressif
  const handleDocumentLoadProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    if (total > 0) {
      const progress = Math.round((loaded / total) * 100);
      setLoadingProgress(progress);
    }
  };

  // Mémoriser les options pour éviter les rechargements inutiles
  const documentOptions = useMemo(() => ({
    // Optimisations pour améliorer les performances
    // Utiliser le streaming pour charger le PDF progressivement
    disableAutoFetch: false,
    disableStream: false,
    disableRange: false,
    // Ne pas charger les polices et les cartes de caractères (améliore les performances)
    verbosity: 0, // Réduire les logs
  }), []);

  return (
    <div className="w-full flex flex-col h-full">
      {/* Zone d'affichage PDF */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4 flex justify-center relative">
        {error ? (
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium mb-2">Impossible d'afficher le PDF</p>
            <p className="text-sm text-gray-500">Veuillez réessayer plus tard</p>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="flex flex-col items-center justify-center absolute inset-0 bg-white/90 backdrop-blur-sm z-10">
                <Loader className="h-8 w-8 animate-spin text-mdsc-blue-primary mb-4" />
                <p className="text-sm text-gray-600 mb-2">Chargement du PDF...</p>
                {loadingProgress > 0 && (
                  <div className="w-64 bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-mdsc-blue-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500">{loadingProgress}%</p>
              </div>
            )}
            <Document
              ref={documentRef}
              file={url}
              loading={
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <Loader className="h-8 w-8 animate-spin text-mdsc-blue-primary mb-4" />
                  <p className="text-sm text-gray-600">Chargement du document...</p>
                </div>
              }
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
                setIsLoading(false);
                setError(false);
                setLoadingProgress(100);
              }}
              onLoadError={(error) => {
                console.error('Erreur lors du chargement du PDF:', error);
                setError(true);
                setIsLoading(false);
                setIsLoadingPage(false);
              }}
              onLoadProgress={handleDocumentLoadProgress}
              options={documentOptions}
              className="shadow-lg"
            >
              {!isLoading && (
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="flex items-center justify-center min-h-[400px]">
                      <Loader className="h-6 w-6 animate-spin text-mdsc-blue-primary" />
                    </div>
                  }
                  onRenderSuccess={() => {
                    setIsLoadingPage(false);
                  }}
                  onRenderError={(error) => {
                    console.error('Erreur lors du rendu de la page:', error);
                    setIsLoadingPage(false);
                  }}
                  className="border border-gray-300"
                />
              )}
            </Document>
          </>
        )}
      </div>

      {/* Barre de contrôles en bas */}
      <div className="bg-gray-100 px-4 py-3 border-t border-gray-200 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
          disabled={pageNumber <= 1 || isLoading}
          className="p-2 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Page précédente"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
          {numPages ? `Page ${pageNumber} / ${numPages}` : 'Chargement...'}
        </span>
        <button
          onClick={() => setPageNumber(prev => Math.min(numPages || 1, prev + 1))}
          disabled={!numPages || pageNumber >= numPages || isLoading}
          className="p-2 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Page suivante"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

