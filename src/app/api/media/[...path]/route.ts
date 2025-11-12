import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api(?:\/)?$/, '');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // Gérer les params synchrones et asynchrones (Next.js 15)
    const resolvedParams = context.params instanceof Promise ? await context.params : context.params;
    const pathArray = resolvedParams.path || [];
    
    if (!Array.isArray(pathArray) || pathArray.length === 0) {
      console.error('❌ [PROXY] Paramètres de chemin invalides:', pathArray);
      return new NextResponse('Invalid path', { status: 400 });
    }
    
    const path = pathArray.join('/');
    
    // Construire l'URL complète vers le backend
    // Essayer d'abord directement /uploads/..., puis /api/media/uploads/... si nécessaire
    let mediaUrl = `${MEDIA_BASE_URL}/${path}`;
    
    // Si le chemin commence par "uploads/", essayer aussi la route API du backend
    const alternativeUrl = path.startsWith('uploads/') 
      ? `${API_BASE_URL.replace('/api', '')}/api/media/${path}`
      : null;
    
    console.log('🖼️ [PROXY] Récupération de l\'image:', {
      params: resolvedParams,
      pathArray,
      path,
      mediaUrl,
      alternativeUrl,
      MEDIA_BASE_URL,
    });
    
    // Récupérer l'image depuis le backend
    let response = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*,*/*',
      },
      // Désactiver le cache pour éviter les problèmes
      cache: 'no-store',
    });
    
    // Si la première tentative échoue et qu'on a une URL alternative, essayer celle-ci
    if (!response.ok && alternativeUrl) {
      console.log('⚠️ [PROXY] Première tentative échouée, essai avec URL alternative:', alternativeUrl);
      response = await fetch(alternativeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/*,*/*',
        },
        cache: 'no-store',
      });
      if (response.ok) {
        mediaUrl = alternativeUrl;
      }
    }

    if (!response.ok) {
      console.error('❌ [PROXY] Erreur lors de la récupération:', {
        status: response.status,
        statusText: response.statusText,
        url: mediaUrl,
      });
      return new NextResponse(`Image not found: ${mediaUrl}`, { status: 404 });
    }

    // Récupérer le type de contenu et les données
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();

    console.log('✅ [PROXY] Image récupérée avec succès:', {
      contentType,
      size: imageBuffer.byteLength,
      url: mediaUrl,
    });

    // Retourner l'image avec les en-têtes appropriés
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error: any) {
    console.error('❌ [PROXY] Erreur lors du proxy de l\'image:', {
      error: error.message,
      stack: error.stack,
      params: context.params instanceof Promise ? 'Promise' : context.params,
    });
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
