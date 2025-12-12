'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, Quote } from 'lucide-react';
import { testimonialService, Testimonial } from '../../lib/services/testimonialService';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Charger les témoignages depuis l'API
  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        setLoading(true);
        // Récupérer uniquement les témoignages approuvés et actifs, triés par ordre d'affichage
        const data = await testimonialService.getTestimonials({
          order: 'asc',
          orderBy: 'display_order',
          status: 'approved', // Seulement les témoignages approuvés
        });
        
        // Filtrer uniquement les témoignages approuvés et actifs (si le backend ne le fait pas)
        const activeTestimonials = data.filter(t => 
          t.is_active === true && 
          (t.status === 'approved' || !t.status) // Support des anciens témoignages sans status
        );
        
        // Trier par display_order si disponible, sinon par id
        const sorted = activeTestimonials.sort((a, b) => {
          if (a.display_order !== undefined && b.display_order !== undefined) {
            return a.display_order - b.display_order;
          }
          return Number(a.id) - Number(b.id);
        });
        setTestimonials(sorted);
      } catch (error) {
        console.error('Erreur lors du chargement des témoignages:', error);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };

    loadTestimonials();
  }, []);

  // Défilement automatique
  useEffect(() => {
    if (testimonials.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Change toutes les 5 secondes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [testimonials.length]);

  // Scroll horizontal uniquement dans le conteneur (sans affecter le scroll de la page)
  useEffect(() => {
    if (scrollContainerRef.current && testimonials.length > 1) {
      const container = scrollContainerRef.current;
      const testimonialElement = container.children[currentIndex] as HTMLElement;
      if (testimonialElement) {
        // Calculer la position de scroll pour centrer l'élément dans le conteneur
        const containerWidth = container.clientWidth;
        const elementLeft = testimonialElement.offsetLeft;
        const elementWidth = testimonialElement.clientWidth;
        const scrollPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2);
        
        // Faire défiler uniquement le conteneur horizontal, pas la page
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth',
        });
      }
    }
  }, [currentIndex, testimonials.length]);

  // Générer les initiales pour l'avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <section className="section-mdsc bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement des témoignages...</p>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // Ne rien afficher s'il n'y a pas de témoignages
  }

  return (
    <section className="section-mdsc bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Ce que disent nos utilisateurs
          </h2>
        </div>

        {/* Container avec défilement horizontal */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-8 pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className="flex-shrink-0 w-full md:w-1/2 lg:w-1/3 snap-center"
              >
                <div className="card-mdsc relative h-full">
                  {/* Quote icon */}
                  <div className="absolute -top-4 -left-4 z-10">
                    <div className="w-8 h-8 bg-mdsc-orange rounded-full flex items-center justify-center shadow-lg">
                      <Quote className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Quote text */}
                  <blockquote className="text-body text-lg leading-relaxed mb-6 italic pt-2">
                    "{testimonial.quote}"
                  </blockquote>

                  {/* Author info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-mdsc-blue rounded-full flex items-center justify-center text-white text-heading text-lg font-semibold flex-shrink-0">
                      {testimonial.avatar || getInitials(testimonial.author)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-heading font-semibold truncate">
                        {testimonial.author}
                      </h4>
                      {testimonial.title && (
                        <p className="text-small text-gray-600 truncate">
                          {testimonial.title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  {testimonial.rating && testimonial.rating > 0 && (
                    <div className="flex items-center mt-4">
                      {[...Array(Math.min(testimonial.rating, 5))].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-mdsc-orange fill-current" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Indicateurs de pagination */}
          {testimonials.length > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 bg-mdsc-orange'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Aller au témoignage ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
