'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Loader, AlertCircle } from 'lucide-react';
import { init } from 'pptx-preview';

interface PptxViewerProps {
  url: string;
  filename?: string;
}

export default function PptxViewer({ url, filename }: PptxViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || !url) return;

    const loadAndRenderPptx = async () => {
      setIsLoading(true);
      setError(false);

      try {
        // Télécharger le fichier PPTX
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du fichier');
        }

        const arrayBuffer = await response.arrayBuffer();

        // Attendre que le conteneur soit disponible
        const container = containerRef.current;
        if (!container) {
          throw new Error('Conteneur non trouvé');
        }

        // Nettoyer le contenu précédent
        container.innerHTML = '';

        // Obtenir les dimensions du conteneur
        const containerRect = container.getBoundingClientRect();
        const containerWidth = Math.max(containerRect.width || 960, 640);
        const aspectRatio = 16 / 9;
        const height = Math.max(Math.round(containerWidth / aspectRatio), 540);
        const width = containerWidth;

        // Appliquer les styles au conteneur
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        container.style.minWidth = `${width}px`;
        container.style.minHeight = `${height}px`;
        container.style.maxWidth = `${width}px`;
        container.style.maxHeight = `${height}px`;
        container.style.position = 'relative';
        container.style.overflow = 'hidden';
        container.style.backgroundColor = '#f5f5f5';
        container.style.display = 'block';
        container.style.margin = '0 auto';
        container.style.boxSizing = 'border-box';
        container.style.padding = '0';

        // Attendre que les styles soient appliqués
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 100));

        // Initialiser le preview avec pptx-preview
        const previewer = init(container, {
          width: width,
          height: height
        });

        // Afficher le fichier
        previewer.preview(arrayBuffer);
        previewerRef.current = previewer;

        // Essayer d'obtenir le nombre de slides
        setTimeout(() => {
          const slides = container.querySelectorAll('.slide, [class*="slide"]');
          if (slides.length > 0) {
            setTotalSlides(slides.length);
          }
        }, 1000);

        setIsLoading(false);
      } catch (err: any) {
        console.error('Erreur lors du chargement du fichier PPTX:', err);
        setError(true);
        setIsLoading(false);
      }
    };

    loadAndRenderPptx();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      previewerRef.current = null;
    };
  }, [url]);

  return (
    <div className="w-full flex flex-col h-full">
      {/* Barre de contrôles */}
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (previewerRef.current && typeof previewerRef.current.prev === 'function') {
                previewerRef.current.prev();
                setCurrentSlide(prev => Math.max(0, prev - 1));
              }
            }}
            disabled={currentSlide <= 0 || isLoading}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Slide précédente"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
            {totalSlides > 0 ? `Slide ${currentSlide + 1} / ${totalSlides}` : 'Présentation'}
          </span>
          <button
            onClick={() => {
              if (previewerRef.current && typeof previewerRef.current.next === 'function') {
                previewerRef.current.next();
                setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1));
              }
            }}
            disabled={totalSlides > 0 && currentSlide >= totalSlides - 1 || isLoading}
            className="p-2 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Slide suivante"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Zone d'affichage */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4 flex justify-center">
        {isLoading && (
          <div className="flex flex-col items-center justify-center">
            <Loader className="h-8 w-8 animate-spin text-mdsc-blue-primary mb-4" />
            <p className="text-sm text-gray-600">Chargement de la présentation...</p>
          </div>
        )}
        {error ? (
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium mb-2">Impossible d'afficher la présentation</p>
            <p className="text-sm text-gray-500">Veuillez réessayer plus tard</p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="pptx-container"
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              minHeight: '540px',
              maxHeight: '85vh',
              backgroundColor: '#f5f5f5',
            }}
          />
        )}
      </div>
    </div>
  );
}

