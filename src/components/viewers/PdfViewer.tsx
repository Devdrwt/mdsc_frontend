'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Loader, AlertCircle } from 'lucide-react';

// Configurer le worker PDF.js avec préchargement
if (typeof window !== 'undefined') {
  // Essayer d'abord le worker local, sinon utiliser le CDN
  const localWorkerPath = '/pdfjs-worker/pdf.worker.min.mjs';
  const cdnWorkerPath = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  
  // Vérifier si le worker local existe, sinon utiliser le CDN
  const checkAndSetWorker = async () => {
    try {
      const response = await fetch(localWorkerPath, { method: 'HEAD' });
      if (response.ok) {
        pdfjs.GlobalWorkerOptions.workerSrc = localWorkerPath;
      } else {
        pdfjs.GlobalWorkerOptions.workerSrc = cdnWorkerPath;
      }
    } catch (error) {
      // Si le worker local n'existe pas, utiliser le CDN
      pdfjs.GlobalWorkerOptions.workerSrc = cdnWorkerPath;
    }
  };
  
  // Configurer le worker dès que possible
  if (document.readyState === 'complete') {
    checkAndSetWorker();
  } else {
    window.addEventListener('load', checkAndSetWorker);
    // Aussi essayer immédiatement si le document est déjà chargé
    checkAndSetWorker();
  }
  
  // Par défaut, utiliser le CDN en attendant
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = cdnWorkerPath;
  }
}

interface PdfViewerProps {
  url: string;
  filename?: string;
}

export default function PdfViewer({ url, filename }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [workerReady, setWorkerReady] = useState(false);
  const documentRef = useRef<any>(null);

  // Détecter si on est sur mobile et ajuster le zoom en conséquence
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 768; // Breakpoint md de Tailwind
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Zoom adaptatif : plus petit sur mobile pour un meilleur rendu
  const scale = isMobile ? 0.5 : 0.7; // 50% sur mobile, 70% sur desktop

  // Vérifier que le worker est prêt
  useEffect(() => {
    const checkWorker = async () => {
      try {
        // Vérifier que le worker est configuré
        if (pdfjs.GlobalWorkerOptions.workerSrc) {
          // Attendre un peu pour que le worker soit initialisé
          await new Promise(resolve => setTimeout(resolve, 100));
          setWorkerReady(true);
        } else {
          // Si pas de worker configuré, utiliser le CDN par défaut
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
          await new Promise(resolve => setTimeout(resolve, 100));
          setWorkerReady(true);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du worker PDF.js:', error);
        setWorkerReady(true); // Continuer quand même
      }
    };
    
    checkWorker();
  }, []);

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
      <div className={`flex-1 overflow-auto bg-gray-50 flex justify-center relative ${isMobile ? 'p-2' : 'p-4'}`}>
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
            {workerReady ? (
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
                {!isLoading && numPages && (
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
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader className="h-8 w-8 animate-spin text-mdsc-blue-primary mb-4" />
                <p className="text-sm text-gray-600">Initialisation du visualiseur PDF...</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Barre de contrôles en bas */}
      <div className={`bg-gray-100 border-t border-gray-200 flex flex-wrap items-center justify-center ${isMobile ? 'px-2 py-2 gap-2' : 'px-4 py-3 gap-3'}`}>
        <button
          onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
          disabled={pageNumber <= 1 || isLoading}
          className={`rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isMobile ? 'p-1.5' : 'p-2'}`}
          title="Page précédente"
        >
          <ChevronLeft className={`text-gray-700 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </button>
        <span className={`font-medium text-gray-700 text-center ${isMobile ? 'text-xs min-w-[80px]' : 'text-sm min-w-[100px]'}`}>
          {numPages ? `Page ${pageNumber} / ${numPages}` : 'Chargement...'}
        </span>
        <button
          onClick={() => setPageNumber(prev => Math.min(numPages || 1, prev + 1))}
          disabled={!numPages || pageNumber >= numPages || isLoading}
          className={`rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isMobile ? 'p-1.5' : 'p-2'}`}
          title="Page suivante"
        >
          <ChevronRight className={`text-gray-700 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
        </button>
      </div>
    </div>
  );
}

