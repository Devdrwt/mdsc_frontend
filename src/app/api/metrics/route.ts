import client from "prom-client";

// Empêcher toute mise en cache côté Next/Edge
export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Registre dédié pour éviter la pollution globale
const register = new client.Registry();
client.collectDefaultMetrics({ register });

export async function GET() {
  const metrics = await register.metrics();

  return new Response(metrics, {
    status: 200,
    headers: {
      "Content-Type": register.contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
