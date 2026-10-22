// /sitemap.xml — lijst van alle pagina's voor Google, inclusief elke gepubliceerde
// evenementpagina. Wordt bij elke aanvraag vers uit Supabase opgebouwd, zodat
// nieuwe evenementen van de scraper er vanzelf in staan.
// Gebruikt dezelfde openbare (alleen-lezen) sleutel als db.js.

const SUPABASE_URL = 'https://tcitvbeoddwanyljpcuo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaXR2YmVvZGR3YW55bGpwY3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMjYxODksImV4cCI6MjEwNDYwMjE4OX0.3HodNlQSFXVhXSpNB_be_CtY5vvU9qbfO7Xq_Yxus0E';

const PAGES = [
  '', 'agenda.html', 'trainingsschemas.html', 'kids.html', 'fotos.html',
  'overons.html', 'contact.html', 'faq.html',
  'regio-noord.html', 'regio-oost.html', 'regio-zuid.html', 'regio-west.html'
];

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async (req) => {
  const base = new URL(req.url).origin + '/';
  let events = [];
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/events?select=id&published=eq.true&order=date.asc', {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY }
    });
    if (res.ok) events = await res.json();
  } catch (e) {
    // Zonder database toch een geldige sitemap met de vaste pagina's
  }

  const urls = PAGES.map((p) => base + p)
    .concat(events.map((e) => base + 'evenement.html?id=' + e.id));

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => '  <url><loc>' + xmlEscape(u) + '</loc></url>').join('\n') +
    '\n</urlset>\n';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};

export const config = { path: '/sitemap.xml' };
