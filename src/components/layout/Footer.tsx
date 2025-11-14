import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    formation: [
      { name: 'Catalogue des cours', href: '/courses' },
      { name: 'Formations en ligne', href: '/online-training' },
      { name: 'Certifications', href: '/certifications' },
      { name: 'Classes virtuelles', href: '/virtual-classes' },
    ],
    organisation: [
      { name: 'À propos de MdSC', href: '/about' },
      { name: 'Notre mission', href: '/mission' },
      { name: 'Équipe', href: '/team' },
      { name: 'Partenaires', href: '/partners' },
    ],
    support: [
      { name: 'Centre d\'aide', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact', href: '/contact' },
      { name: 'Support technique', href: '/support' },
    ],
  };

  return (
    <footer className="relative text-white overflow-hidden">
      {/* Image de fond */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/footer-image.jpg')" }}
      ></div>

      {/* Couche bleu nuit */}
      <div className="absolute inset-0 bg-blue-950/60"></div>

      {/* Couche bleu principal */}
      <div 
        className="absolute inset-0" 
        style={{ backgroundColor: 'rgba(0, 96, 149, 0.95)' }}
      ></div>

      {/* Contenu */}
      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Logo et description */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <a href="/">
                <img
                  src="/logo-mdsc.png"
                  alt="Maison de la Société Civile"
                  className="w-auto h-16 object-contain"
                />
              </a>
            </div>
            <p className="text-sm leading-relaxed">
              La Maison de la Société Civile forme et accompagne les organisations 
              de la société civile pour renforcer leur crédibilité et leur innovation.
            </p>
          </div>

          {/* Formation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Formation</h3>
            <ul className="space-y-2">
              {footerLinks.formation.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-mdsc-orange text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Organisation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Organisation</h3>
            <ul className="space-y-2">
              {footerLinks.organisation.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-mdsc-orange text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="hover:text-mdsc-orange text-sm transition-colors duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Adresse (dernière colonne à droite) */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Adresse</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-mdsc-orange flex-shrink-0 mt-0.5" />
                <span>
                  Quartier Sikècodji Rue N°216, Carré 00350<br />
                  Direction Etoile Rouge, Carrefour Cossi<br />
                  BP 01 BP 414 Cotonou
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-mdsc-orange" />
                <span>(+229) 43 05 00 00</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-mdsc-orange" />
                <span>info@mdscbenin.org</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne de séparation */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              © {currentYear} Maison de la Société Civile. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="/privacy"
                className="hover:text-mdsc-orange text-sm transition-colors duration-200"
              >
                Politique de confidentialité
              </a>
              <a
                href="/terms"
                className="hover:text-mdsc-orange text-sm transition-colors duration-200"
              >
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}