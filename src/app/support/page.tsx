'use client';

import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { HelpCircle, ArrowRight, Mail, MessageCircle, Send, Settings, AlertCircle, CheckCircle } from 'lucide-react';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'technical',
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
      // TODO: Intégrer avec l'API de support
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'technical',
        message: ''
      });

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error('Support form error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'technical', label: 'Problème technique' },
    { value: 'account', label: 'Problème de compte' },
    { value: 'payment', label: 'Problème de paiement' },
    { value: 'course', label: 'Question sur un cours' },
    { value: 'other', label: 'Autre' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section 
        className="py-16"
        style={{
          backgroundImage: `url('/Hero.png')`
        }}
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <nav className="text-white opacity-75 mb-6">
            <span className="flex items-center justify-center space-x-2">
              <span>Accueil</span>
              <ArrowRight className="h-4 w-4" />
              <span>Support technique</span>
            </span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Support Technique
          </h1>
          <p className="text-xl text-white opacity-90 max-w-3xl mx-auto">
            Notre équipe est là pour vous aider à résoudre vos problèmes techniques
          </p>
        </div>
      </section>

      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Formulaire de support */}
          <section className="mb-16">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-mdsc-blue-primary rounded-full flex items-center justify-center mr-4">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Formulaire de Support
                  </h2>
                  <p className="text-gray-600">
                    Décrivez votre problème et nous vous répondrons rapidement
                  </p>
                </div>
              </div>

              {isSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-medium">Demande envoyée avec succès !</p>
                    <p className="text-green-700 text-sm">Nous vous répondrons dans les 24-48 heures.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
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
                      Email *
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
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie du problème *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent"
                    placeholder="Résumé du problème"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Description détaillée *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mdsc-blue-primary focus:border-transparent resize-none"
                    placeholder="Décrivez votre problème en détail..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-mdsc-blue-primary text-white py-3 px-6 rounded-lg hover:bg-mdsc-blue-dark transition-colors font-medium flex items-center justify-center"
                >
                  <Send className="h-5 w-5 mr-2" />
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                </button>
              </form>
            </div>
          </section>

          {/* Autres moyens de contact */}
          <section className="bg-gray-50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Autres Moyens de Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 text-center">
                <Mail className="h-8 w-8 text-mdsc-blue-primary mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Email</h4>
                <a href="mailto:support@mdscbenin.org" className="text-mdsc-blue-primary hover:underline">
                  support@mdscbenin.org
                </a>
              </div>
              <div className="bg-white rounded-lg p-6 text-center">
                <MessageCircle className="h-8 w-8 text-mdsc-blue-primary mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">FAQ</h4>
                <a href="/faq" className="text-mdsc-blue-primary hover:underline">
                  Consulter la FAQ
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

