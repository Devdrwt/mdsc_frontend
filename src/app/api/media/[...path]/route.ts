import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api(?:\/)?$/, '');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Gérer les params asynchrones (Next.js 15)
    const resolvedParams = await context.params;
    const pathArray = resolvedParams.path || [];
    
    if (!Array.isArray(pathArray) || pathArray.length === 0) {
      console.error('❌ [PROXY] Paramètres de chemin invalides:', pathArray);
      return new NextResponse('Invalid path', { status: 400 });
    }
    
    let path = pathArray.join('/');
    
    // Si le path commence par "api/media/", le retirer car c'est déjà le proxy Next.js
    // Cela évite la double inclusion de /api/media/
    if (path.startsWith('api/media/')) {
      path = path.replace(/^api\/media\//, '');
    }
    
    // Construire l'URL complète vers le backend
    // Le backend Laravel sert généralement les fichiers depuis le dossier public
    // Essayer plusieurs variantes d'URL pour trouver celle qui fonctionne
    
    // Nettoyer le path pour éviter les doublons et les caractères étranges
    let cleanPath = path;
    if (cleanPath.startsWith('uploads/')) {
      cleanPath = cleanPath.replace(/^uploads\//, '');
    }
    
    // S'assurer que cleanPath ne contient pas de caractères étranges
    cleanPath = cleanPath.replace(/\/+/g, '/'); // Remplacer les slashes multiples par un seul
    cleanPath = cleanPath.replace(/^\/+|\/+$/g, ''); // Retirer les slashes au début et à la fin
    
    // Valider que cleanPath est valide
    if (!cleanPath || cleanPath.length === 0) {
      console.error('❌ [PROXY] cleanPath est vide ou invalide:', { path, cleanPath });
      return new NextResponse('Invalid path', { status: 400 });
    }
    
    // Construire les URLs de manière sécurisée
    const baseUrl = MEDIA_BASE_URL.replace(/\/+$/, ''); // Retirer les slashes à la fin
    const apiBaseUrl = API_BASE_URL.replace(/\/+$/, ''); // Retirer les slashes à la fin
    
    // Le backend a une route API qui recherche dans plusieurs dossiers
    // Essayer d'abord la route API /api/media/uploads/... qui recherche dans plusieurs dossiers
    let mediaUrl = `${apiBaseUrl}/media/uploads/${cleanPath}`;
    
    // URLs alternatives à essayer si la première échoue
    // Construire chaque URL individuellement pour éviter les erreurs
    const alternativeUrls: string[] = [];
    
    // Essayer directement /uploads/... (si le backend sert les fichiers statiques)
    const directUploadsUrl = `${baseUrl}/uploads/${cleanPath}`;
    alternativeUrls.push(directUploadsUrl);
    
    // Laravel storage
    const storageUrl = `${baseUrl}/storage/${cleanPath}`;
    alternativeUrls.push(storageUrl);
    
    // Public/uploads (pour certains setups Laravel)
    const publicUploadsUrl = `${baseUrl}/public/uploads/${cleanPath}`;
    alternativeUrls.push(publicUploadsUrl);
    
    // Log pour vérifier la construction des URLs (seulement en développement pour éviter les logs excessifs en production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [PROXY] Construction des URLs:', {
        cleanPath,
        baseUrl,
        apiBaseUrl,
        mediaUrl,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        alternativeUrls: alternativeUrls.map((url, idx) => ({
          index: idx,
          url,
          type: typeof url,
          length: url.length,
        })),
      });
    }
    
    // Valider les URLs avant de les utiliser
    const validateUrl = (url: string): boolean => {
      try {
        const parsed = new URL(url);
        // Vérifier qu'il n'y a pas de fautes de frappe évidentes (doublons de lettres)
        const pathname = parsed.pathname;
        // Détecter les patterns comme "couurses", "coursses", "uploadds"
        if (pathname.match(/([a-z])\1{2,}/i)) {
          console.warn('⚠️ [PROXY] URL suspecte détectée (doublons de lettres):', url);
          return false;
        }
        return true;
      } catch {
        return false;
      }
    };
    
    // Valider mediaUrl
    if (!validateUrl(mediaUrl)) {
      console.error('❌ [PROXY] mediaUrl invalide:', mediaUrl);
      return new NextResponse('Invalid URL', { status: 400 });
    }
    
    // Valider les URLs alternatives
    const validAlternativeUrls = alternativeUrls.filter(validateUrl);
    
    // Log seulement en développement
    if (process.env.NODE_ENV === 'development') {
      console.log('🖼️ [PROXY] Récupération du média:', {
        params: resolvedParams,
        pathArray,
        path,
        cleanPath,
        mediaUrl,
        alternativeUrls: validAlternativeUrls,
        MEDIA_BASE_URL,
        baseUrl,
        apiBaseUrl,
      });
    }
    
    // Récupérer le média depuis le backend (image, vidéo, audio, document, etc.)
    // En production, ajouter un timeout pour éviter les attentes infinies
    let abortController: AbortController | null = null;
    if (process.env.NODE_ENV === 'production') {
      abortController = new AbortController();
      // Timeout de 30 secondes en production
      setTimeout(() => {
        if (abortController) {
          abortController.abort();
        }
      }, 30000);
    }
    
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Accept': '*/*', // Accepter tous les types de médias (image, vidéo, audio, document, etc.)
        'User-Agent': 'MDSC-Frontend-Media-Proxy/1.0',
      },
      // Désactiver le cache pour éviter les problèmes
      cache: 'no-store',
      signal: abortController?.signal,
    };
    
    let response: Response;
    try {
      response = await fetch(mediaUrl, fetchOptions);
    } catch (fetchError: any) {
      console.error('❌ [PROXY] Erreur fetch:', {
        url: mediaUrl,
        error: fetchError.message,
        name: fetchError.name,
        code: fetchError.code,
      });
      
      // Si c'est une erreur de timeout ou de réseau, essayer les URLs alternatives
      if (fetchError.name === 'AbortError' || fetchError.name === 'TypeError') {
        // Continuer avec les URLs alternatives
        response = new Response(null, { status: 0 });
      } else {
        throw fetchError;
      }
    }
    
    // Si la première tentative échoue, essayer les URLs alternatives validées
    if (!response.ok && validAlternativeUrls.length > 0) {
      for (let i = 0; i < validAlternativeUrls.length; i++) {
        const altUrl = validAlternativeUrls[i];
        
        // Vérifier que l'URL est bien construite avant de l'essayer
        const urlToTry = String(altUrl);
        if (process.env.NODE_ENV === 'development') {
          console.log(`⚠️ [PROXY] Première tentative échouée, essai avec URL alternative ${i + 1}/${validAlternativeUrls.length}:`, urlToTry);
        }
        
        try {
          let altAbortController: AbortController | null = null;
          if (process.env.NODE_ENV === 'production') {
            altAbortController = new AbortController();
            setTimeout(() => {
              if (altAbortController) {
                altAbortController.abort();
              }
            }, 30000);
          }
          
          const altFetchOptions: RequestInit = {
            method: 'GET',
            headers: {
              'Accept': '*/*', // Accepter tous les types de médias
              'User-Agent': 'MDSC-Frontend-Media-Proxy/1.0',
            },
            cache: 'no-store',
            signal: altAbortController?.signal,
          };
          
          const altResponse = await fetch(urlToTry, altFetchOptions);
          if (altResponse.ok) {
            // Mettre à jour mediaUrl et response si l'URL alternative fonctionne
            mediaUrl = urlToTry;
            response = altResponse;
            console.log('✅ [PROXY] Média trouvé via URL alternative:', urlToTry);
            break;
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log(`⚠️ [PROXY] URL alternative ${i + 1} a retourné ${altResponse.status}:`, urlToTry);
            }
          }
        } catch (err: any) {
          console.warn(`⚠️ [PROXY] Erreur avec URL alternative ${i + 1}:`, urlToTry, err?.message || err);
          continue;
        }
      }
    }

    if (!response || !response.ok) {
      const errorStatus = response?.status || 0;
      const errorStatusText = response?.statusText || 'Unknown error';
      
      console.error('❌ [PROXY] Erreur lors de la récupération:', {
        status: errorStatus,
        statusText: errorStatusText,
        url: mediaUrl,
        cleanPath,
        baseUrl,
        apiBaseUrl,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      });
      
      // En production, retourner une erreur plus détaillée pour le débogage
      return new NextResponse(
        JSON.stringify({
          error: 'Media not found',
          message: `Impossible de récupérer le média depuis: ${mediaUrl}`,
          status: errorStatus,
          path: cleanPath,
        }),
        { 
          status: errorStatus || 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Récupérer le type de contenu et les données
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    let mediaBuffer: ArrayBuffer;
    
    try {
      mediaBuffer = await response.arrayBuffer();
    } catch (bufferError: any) {
      console.error('❌ [PROXY] Erreur lors de la lecture du buffer:', {
        error: bufferError.message,
        url: mediaUrl,
      });
      return new NextResponse(
        JSON.stringify({
          error: 'Buffer read error',
          message: bufferError.message,
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [PROXY] Média récupéré avec succès:', {
        contentType,
        size: mediaBuffer.byteLength,
        url: mediaUrl,
      });
    }

    // Retourner le média avec les en-têtes appropriés
    return new NextResponse(mediaBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Accept-Ranges': 'bytes', // Important pour les vidéos (streaming)
      },
    });
  } catch (error: any) {
    console.error('❌ [PROXY] Erreur lors du proxy du média:', {
      error: error.message,
      stack: error.stack,
    });
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
