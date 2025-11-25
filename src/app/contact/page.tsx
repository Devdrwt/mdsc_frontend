'use client';

import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { Mail, Phone, MapPin, Clock, Send, ArrowRight, Globe, Linkedin, Facebook, Twitter } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs obligatoires (trim pour éviter les espaces)
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedSubject = formData.subject.trim();
    const trimmedMessage = formData.message.trim();
    
    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // TODO: Intégrer avec l'API d'envoi d'email
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error('Contact form error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjects = [
    'Demande d\'information',
    'Support technique',
    'Partenariat',
    'Formation personnalisée',
    'Autre'
  ];

  const socialMedia = [
    { name: 'Site web', icon: Globe, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'X (Twitter)', icon: Twitter, href: '#' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16"
        style={{
    backgroundImage: `url('/Hero.png')`
  }} >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
            Nous sommes à votre écoute pour toute demande ou collaboration.
          </p>
        </div>
      </section>

      <main className="py-16">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-20">
          
          {/* Contact Information Cards */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Adresse */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Adresse</h3>
                <p className="text-gray-600">
                  Maison de la Société Civile<br />
                  Rue de l'Innovation Sociale<br />
                  Cotonou, Bénin
                </p>
              </div>

              {/* Téléphone */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Téléphone</h3>
                <p className="text-gray-600">
                  <a href="tel:+22921000000" className="hover:text-mdsc-blue-primary transition-colors">
                    (+229) 21 00 00 00
                  </a><br />
                  <a href="tel:+22997000000" className="hover:text-mdsc-blue-primary transition-colors">
                    (+229) 97 00 00 00
                  </a>
                </p>
              </div>

              {/* Email */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600">
                  <a href="mailto:contact@mdsc.bj" className="hover:text-mdsc-blue-primary transition-colors">
                    contact@mdsc.bj
                  </a><br />
                  <a href="mailto:support@mdsc.bj" className="hover:text-mdsc-blue-primary transition-colors">
                    support@mdsc.bj
                  </a>
                </p>
              </div>
            </div>

            {/* Horaires d'ouverture */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center mr-4">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Horaires d'ouverture</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Lundi - Vendredi</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    08h00 - 17h30
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Samedi - Dimanche</span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    Fermé
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form and Location */}
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Formulaire de contact */}
              <div>
                <div className="mb-4">
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
                    <p className="text-green-800 font-medium">Message envoyé avec succès !</p>
                    <p className="text-green-700 text-sm">Nous vous répondrons dans les 24-48 heures.</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                      placeholder="Votre nom et prénom"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                      placeholder="votre.email@exemple.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Sujet
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
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
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent resize-none"
                      placeholder="Votre message...."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-mdsc-blue-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                  </button>
                </form>
              </div>

              {/* Localisation */}
              <div>
                <div className="mb-4">
                  <span className="inline-block bg-[#D79A49] text-white px-3 py-1 rounded-full text-sm font-medium mb-2">
                    Où nous trouver
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Localisation
                  </h2>
                  <p className="text-gray-600">
                    Visitez nos bureaux ou planifiez une rencontre avec notre équipe.
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <div className="w-16 h-16 bg-mdsc-blue-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Maison de la Société Civile
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Rue de l'Innovation Sociale<br />
                    Cotonou, Bénin
                  </p>
                  <button className="bg-[#D79A49] text-white py-2 px-4 rounded-lg hover:bg-[#c1873f] transition-colors font-medium flex items-center mx-auto">
                    <MapPin className="h-4 w-4 mr-2" />
                    Ouvrir dans Maps
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Social Media Follow Section */}
          <section className="bg-gray-50 rounded-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Suivez-nous sur les réseaux sociaux
              </h2>
              <p className="text-gray-600">
                Restez connectés et suivez nos actualités.
              </p>
            </div>

            <div className="flex justify-center space-x-6 mb-8">
              {socialMedia.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-gray-600" />
                      <span className="text-gray-700 font-medium">{social.name}</span>
                    </div>
                  </a>
                );
              })}
            </div>

            <div className="flex justify-center space-x-4">
              <button className="bg-mdsc-blue-primary text-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium">
                Connexion
              </button>
              <button className="bg-mdsc-blue-dark text-white py-2 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium">
                S'inscrire
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}