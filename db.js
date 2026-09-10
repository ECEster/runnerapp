// db.js — Supabase verbinding voor runningnederland.nl

const SUPABASE_URL  = 'https://tcitvbeoddwanyljpcuo.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjaXR2YmVvZGR3YW55bGpwY3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMjYxODksImV4cCI6MjEwNDYwMjE4OX0.3HodNlQSFXVhXSpNB_be_CtY5vvU9qbfO7Xq_Yxus0E';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Haal alle gepubliceerde events op en zet ze in de globale EVENTS array
async function loadEventsFromDB() {
    const { data, error } = await db
        .from('events')
        .select('*')
        .eq('published', true)
        .order('date', { ascending: true });

    if (error) {
        console.warn('Supabase fout, gebruik lokale data:', error.message);
        return false;
    }

    // Zet Supabase-rijen om naar het formaat dat de app verwacht
    EVENTS = data.map(e => ({
        id:               e.id,
        name_nl:          e.name_nl   || '',
        name_en:          e.name_en   || '',
        date:             e.date      || '',
        type:             e.type      || '',
        city:             e.city      || '',
        province:         e.province  || '',
        distances:        e.distances ? e.distances.split(',').map(d => d.trim()) : [],
        price:            e.price     || '',
        organizer:        e.organizer || '',
        description_nl:   e.description_nl || '',
        description_en:   e.description_en || '',
        image:            e.image     || '',
        registration_url: e.registration_url || '',
        kidsrun:          e.kidsrun   || false,
        paid:             true,
        atletiekunie:     false,
        capacity:         null,
        youtube_url:      ''
    }));

    return true;
}

// Voeg een nieuw event toe (voor de admin-pagina)
async function addEvent(event) {
    const { data, error } = await db.from('events').insert([event]).select();
    if (error) throw error;
    return data[0];
}

// Verwijder een event op id (voor de admin-pagina)
async function deleteEvent(id) {
    const { error } = await db.from('events').delete().eq('id', id);
    if (error) throw error;
}

// Upload een afbeelding naar Supabase Storage
async function uploadImage(file) {
    const MAX_MB   = 2;
    const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp'];

    if (!ALLOWED.includes(file.type))
        throw new Error('Alleen JPG, PNG of WebP bestanden zijn toegestaan.');
    if (file.size > MAX_MB * 1024 * 1024)
        throw new Error(`De afbeelding is te groot. Maximum is ${MAX_MB} MB.`);

    const ext      = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await db.storage
        .from('RunningNederland')
        .upload(filename, file, { contentType: file.type });

    if (error) throw error;

    const { data } = db.storage.from('RunningNederland').getPublicUrl(filename);
    return data.publicUrl;
}

// Update een event (voor de admin-pagina)
async function updateEvent(id, updates) {
    const { error } = await db.from('events').update(updates).eq('id', id);
    if (error) throw error;
}

// Haal ALLE events op (ook ongepubliceerde) — alleen voor admin
async function loadAllEventsAdmin() {
    const { data, error } = await db
        .from('events')
        .select('*')
        .order('date', { ascending: true });
    if (error) throw error;
    return data;
}
