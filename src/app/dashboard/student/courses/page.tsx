'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { AuthGuard } from '../../../../lib/middleware/auth';
import MyCourses from '../../../../components/dashboard/student/MyCourses';

export default function CoursesPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Gérer les redirections GobiPay après paiement
    const currentUrl = window.location.href;
    const courseId = searchParams.get('course_id');
    
    // Si course_id est présent, cela signifie qu'on vient de la redirection backend
    // Ne pas rediriger à nouveau vers l'API pour éviter les boucles
    if (courseId) {
      console.log('[GobiPay] ✅ Redirection depuis le backend détectée (course_id présent), nettoyage de l\'URL');
      // Nettoyer l'URL en gardant seulement payment=success et course_id
      const cleanUrl = `/dashboard/student/courses?payment=success&course_id=${courseId}`;
      if (window.location.href !== cleanUrl && !window.location.href.includes(cleanUrl.replace('?', '?'))) {
        window.history.replaceState({}, '', cleanUrl);
      }
      return; // Ne pas rediriger vers l'API si on vient déjà du backend
    }

    // Gérer les URLs malformées comme payment=success/?transaction_slug=...
    let payment: string | null = null;
    let transactionSlug: string | null = null;
    let orderSlug: string | null = null;
    let status: string | null = null;

    // Méthode 1: Essayer avec useSearchParams (méthode normale)
    const paymentFromSearch = searchParams.get('payment');
    const transactionSlugFromSearch = searchParams.get('transaction_slug');
    const orderSlugFromSearch = searchParams.get('order_slug');
    const statusFromSearch = searchParams.get('status');

    if (paymentFromSearch && paymentFromSearch !== 'success/?transaction_slug' && !paymentFromSearch.includes('/?')) {
      // URL normale
      payment = paymentFromSearch;
      transactionSlug = transactionSlugFromSearch;
      orderSlug = orderSlugFromSearch;
      status = statusFromSearch;
    } else {
      // URL malformée - parser manuellement
      const urlMatch = currentUrl.match(/[?&]payment=([^&]*)/);
      if (urlMatch) {
        const paymentValue = urlMatch[1];
        // Si payment contient "success" même avec d'autres caractères après
        if (paymentValue.includes('success')) {
          payment = 'success';
        } else {
          payment = paymentValue;
        }
      }

      // Extraire transaction_slug
      const transactionMatch = currentUrl.match(/[?&]transaction_slug=([^&]*)/);
      if (transactionMatch) {
        transactionSlug = decodeURIComponent(transactionMatch[1]);
      }

      // Extraire order_slug
      const orderMatch = currentUrl.match(/[?&]order_slug=([^&]*)/);
      if (orderMatch) {
        orderSlug = decodeURIComponent(orderMatch[1]);
      }

      // Extraire status
      const statusMatch = currentUrl.match(/[?&]status=([^&]*)/);
      if (statusMatch) {
        status = decodeURIComponent(statusMatch[1]);
      }
    }

    console.log('[GobiPay] 🔍 Vérification des paramètres de paiement (courses page)', {
      payment,
      transactionSlug,
      orderSlug,
      status,
      courseId,
      currentUrl,
      paymentFromSearch,
    });

    // Si GobiPay redirige avec payment=success ET qu'on a transaction_slug ou order_slug (première redirection depuis GobiPay)
    // Ne pas rediriger si on vient déjà du backend (pas de transaction_slug/order_slug mais course_id présent)
    if ((payment === 'success' || (payment && payment.includes('success'))) && (transactionSlug || orderSlug)) {
      // Vérifier si on a déjà traité ce paiement (éviter les boucles)
      const processedKey = `gobipay_processed_${transactionSlug || orderSlug}`;
      if (sessionStorage.getItem(processedKey)) {
        console.log('[GobiPay] ⚠️ Paiement déjà traité, nettoyage de l\'URL');
        // Nettoyer l'URL
        window.history.replaceState({}, '', '/dashboard/student/courses?payment=success');
        return;
      }

      // Marquer comme traité
      sessionStorage.setItem(processedKey, 'true');

      const params = new URLSearchParams({
        payment: 'success',
        ...(transactionSlug && { transaction_slug: transactionSlug }),
        ...(orderSlug && { order_slug: orderSlug }),
        ...(status && { status: status }),
      });

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const apiUrl = `${backendUrl}/api/payments/auto-finalize-gobipay?${params.toString()}`;
      
      console.log('[GobiPay] ✅ Détection de payment=success avec transaction_slug/order_slug, redirection vers l\'API...', apiUrl);
      
      // Rediriger vers l'API qui va finaliser le paiement, créer l'enrollment et rediriger vers le frontend
      window.location.href = apiUrl;
    } else if (payment === 'success' && !transactionSlug && !orderSlug) {
      // Si payment=success mais pas de transaction_slug/order_slug, on vient probablement du backend
      // Nettoyer l'URL et ne pas rediriger
      console.log('[GobiPay] ✅ payment=success sans transaction_slug/order_slug (redirection backend), nettoyage de l\'URL');
      window.history.replaceState({}, '', '/dashboard/student/courses?payment=success');
    } else if (payment === 'failed' || payment === 'cancelled' || (payment && (payment.includes('failed') || payment.includes('cancelled')))) {
      // Nettoyer l'URL pour les échecs/annulations
      const errorStatus = payment?.includes('failed') ? 'failed' : 'cancelled';
      console.log(`[GobiPay] ⚠️ Paiement ${errorStatus}, nettoyage de l'URL`);
      window.history.replaceState({}, '', `/dashboard/student/courses?payment=${errorStatus}`);
    } else if (payment === 'error') {
      // Nettoyer l'URL pour les erreurs
      console.log('[GobiPay] ⚠️ Erreur de paiement, nettoyage de l\'URL');
      window.history.replaceState({}, '', '/dashboard/student/courses');
    }
  }, [searchParams]);

  return (
    <AuthGuard requiredRole="student">
      <DashboardLayout userRole="student">
        <MyCourses />
      </DashboardLayout>
    </AuthGuard>
  );
}
