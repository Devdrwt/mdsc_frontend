'use client';

import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Mail, Phone, MapPin, Send, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Réinitialiser l'erreur quand l'utilisateur commence à taper
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation des champs obligatoires
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedSubject = formData.subject.trim();
    const trimmedMessage = formData.message.trim();
    
    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // TODO: Intégrer avec l'API d'envoi d'email
      // Pour l'instant, simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error('Contact form error:', err);
      setError('Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjects = [
    'Demande d\'information',
    'Support technique',
    'Partenariat',
    'Formation personnalisée',
    'Inscription',
    'Autre'
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-mdsc-blue-dark to-mdsc-blue-primary">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-20 text-center">
          <nav className="text-white opacity-75 mb-6">
            <span className="flex items-center justify-center space-x-2">
              <span>Accueil</span>
              <ArrowRight className="h-4 w-4" />
              <span>Contact</span>
            </span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contactez-nous
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Nous sommes à votre écoute pour toute demande ou collaboration avec la Maison de la Société Civile.
          </p>
        </div>
      </section>

      <main className="py-16 bg-gray-50">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-20">
          
          {/* Contact Form and Location */}
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Formulaire de contact */}
              <div>
                <div className="mb-6">
                  <span className="inline-block bg-mdsc-blue-primary text-white px-3 py-1 rounded-full text-sm font-medium mb-2">
                    Envoyez-nous un message
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Formulaire de contact
                  </h2>
                  <p className="text-gray-600">
                    Remplissez ce formulaire et nous vous répondrons dans les plus brefs délais.
                  </p>
                </div>

                {isSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">✓ Message envoyé avec succès !</p>
                    <p className="text-green-700 text-sm mt-1">Nous vous répondrons dans les 24-48 heures.</p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">✗ {error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-colors"
                      placeholder="Votre nom et prénom"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-colors"
                      placeholder="votre.email@exemple.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone <span className="text-gray-400 text-xs">(optionnel)</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-colors"
                      placeholder="(+229) XX XX XX XX"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent transition-colors bg-white"
                    >
                      <option value="">Sélectionnez un sujet</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      minLength={20}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent resize-none transition-colors"
                      placeholder="Votre message... (minimum 20 caractères)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.message.length} caractère{formData.message.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-mdsc-blue-primary text-white py-3 px-6 rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Envoyer le message
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Informations de contact */}
              <div>
                <div className="mb-6">
                  <span className="inline-block bg-mdsc-gold text-white px-3 py-1 rounded-full text-sm font-medium mb-2">
                    Informations de contact
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Nos coordonnées
                  </h2>
                  <p className="text-gray-600">
                    Contactez-nous directement par téléphone ou email, ou visitez nos bureaux.
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
                  <div>
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Adresse postale</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Quartier Sikècodji Rue N°216, Carré 00350<br />
                          U Boulevard des Armées<br />
                          Direction Etoile Rouge, 2ème Rue à droite après le Carrefour Cossi<br />
                          <span className="font-medium">01 BP 414 Cotonou, Bénin</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Téléphone</h3>
                        <a 
                          href="tel:+2290143050000" 
                          className="text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors font-medium"
                        >
                          (+229) 01 43 05 00 00
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                        <a 
                          href="mailto:info@mdscbenin.org" 
                          className="text-mdsc-blue-primary hover:text-mdsc-blue-dark transition-colors font-medium break-all"
                        >
                          info@mdscbenin.org
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
