import React from 'react';
import { Star, Quote } from 'lucide-react';

interface Testimonial {
  id: string;
  quote: string;
  author: string;
  title: string;
  avatar: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    quote:
      "Les formations MdSC m'ont permis d'acquérir des compétences essentielles en management. Je recommande vivement cette plateforme !",
    author: 'CC Christelle Cakpa',
    title: 'Formatrice certifiée',
    avatar: 'CC',
    rating: 5,
  },
  {
    id: '2',
    quote:
      'Une plateforme excellente avec des cours de qualité. Les certificats ont renforcé la confiance de mes apprenants.',
    author: 'CC Christelle Cakpa',
    title: 'Formatrice certifiée',
    avatar: 'CC',
    rating: 5,
  },
  {
    id: '3',
    quote:
      "Interface intuitive, contenu riche et accompagnement de qualité. C'est un outil indispensable pour la société civile.",
    author: 'CC Christelle Cakpa',
    title: 'Formatrice certifiée',
    avatar: 'CC',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="section-mdsc bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-mdsc-orange text-white mb-4">
            Témoignages
          </div>
                 <h2 className="text-3xl md:text-4xl text-display mb-4">
                   Ce que disent nos apprenants
                 </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="card-mdsc relative">
              {/* Quote icon */}
              <div className="absolute -top-4 -left-4">
                <div className="w-8 h-8 bg-mdsc-orange rounded-full flex items-center justify-center">
                  <Quote className="w-4 h-4 text-white" />
                </div>
              </div>

                     {/* Quote text */}
                     <blockquote className="text-body text-lg leading-relaxed mb-6 italic">
                       "{testimonial.quote}"
                     </blockquote>

                     {/* Author info */}
                     <div className="flex items-center space-x-4">
                       <div className="w-12 h-12 bg-mdsc-blue rounded-full flex items-center justify-center text-white text-heading text-lg">
                         {testimonial.avatar}
                       </div>
                       <div className="flex-1">
                         <h4 className="text-heading">{testimonial.author}</h4>
                         <p className="text-small">{testimonial.title}</p>
                       </div>
                     </div>

              {/* Rating */}
              <div className="flex items-center mt-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-mdsc-orange fill-current" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
