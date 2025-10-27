import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Récupérer la locale depuis les cookies ou utiliser 'fr' par défaut
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'fr';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
