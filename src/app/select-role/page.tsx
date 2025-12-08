'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams?.get('message');

  useEffect(() => {
    const target = message
      ? `/register?message=${encodeURIComponent(message)}`
      : '/register';
    router.replace(target);
  }, [message, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-dark mx-auto" />
        <p className="text-gray-600 text-sm">
          Redirection vers la page d&apos;inscription utilisateur...
        </p>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mdsc-blue-dark mx-auto" />
            <p className="text-gray-600 text-sm">
              Redirection vers la page d&apos;inscription utilisateur...
            </p>
          </div>
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  );
}

