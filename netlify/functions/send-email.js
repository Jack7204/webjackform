/* ============================================================
   NETLIFY FUNCTION — send-email.js
   Invia l'email formattata di discovery via Resend API.

   Setup richiesto:
   1. Crea un account su https://resend.com (gratuito)
   2. Verifica il tuo dominio in Resend (DNS records) — oppure
      usa onboarding@resend.dev per test verso la tua email Resend
   3. Crea una API Key in Resend → aggiungi come variabile
      d'ambiente RESEND_API_KEY in Netlify:
      Site settings → Environment variables → Add variable

   Per cambiare il "from" address, modifica SENDER_EMAIL.
   Per aggiungere il tuo dominio, modifica la variabile
   d'ambiente SENDER_EMAIL da Netlify (es. form@tuodominio.it)

   Free tier Resend (giugno 2025): 100 email/giorno, 3.000/mese
   — ampiamente sufficiente per un form discovery clienti.
============================================================ */

// Email di destinazione (tua) — hardcoded, non esposta al client
const DEST_EMAIL   = 'jacopomolle.consulenza@gmail.com';

// Mittente: cambia con il tuo dominio verificato in Resend
// Se non hai un dominio verificato, usa 'onboarding@resend.dev'
// (in quel caso l'email arriverà solo all'email del tuo account Resend)
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
const SENDER_NAME  = process.env.SENDER_NAME  || 'Form Discovery';

// ============================================================
// CORS headers (la Function è chiamata dalla stessa origin)
// ============================================================
const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ============================================================
// HANDLER PRINCIPALE
// ============================================================
exports.handler = async (event) => {
  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Controlla che la API key sia configurata
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[send-email] RESEND_API_KEY non configurata — email non inviata');
    // Ritorna 200 così il form mostra comunque successo
    // (Netlify Forms ha già salvato la submission come fallback)
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ ok: false, reason: 'api_key_missing' }),
    };
  }

  // Parse del body JSON inviato da script.js
  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  // Honeypot check server-side (doppia protezione)
  if (data.botField) {
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ ok: true, reason: 'bot' }) };
  }

  // Build email HTML
  const subject = `Nuova richiesta discovery — ${data.nomeAttivita || 'Nuovo cliente'}`;
  const html    = buildEmailHtml(data);
  const text    = buildEmailText(data);

  // Invia via Resend REST API
  // Node 18+ ha native fetch — nessuna dipendenza necessaria
  let resendRes;
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to:      [DEST_EMAIL],
        subject: subject,
        html:    html,
        text:    text,
      }),
    });
  } catch (networkErr) {
    console.error('[send-email] Network error calling Resend:', networkErr);
    return {
      statusCode: 502,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Network error contacting Resend' }),
    };
  }

  if (!resendRes.ok) {
    const errBody = await resendRes.text();
    console.error(`[send-email] Resend API error ${resendRes.status}:`, errBody);
    return {
      statusCode: resendRes.status,
      headers: HEADERS,
      body: JSON.stringify({ error: `Resend error: ${errBody}` }),
    };
  }

  const result = await resendRes.json();
  console.log('[send-email] Email inviata con successo. ID:', result.id);

  return {
    statusCode: 200,
    headers: HEADERS,
    body: JSON.stringify({ ok: true, id: result.id }),
  };
};

// ============================================================
// HELPER — valore leggibile (vuoto → "Non specificato")
// ============================================================
function display(v) {
  if (v === null || v === undefined || v === '' || v === false) return 'Non specificato';
  if (v === true) return 'Sì';
  return String(v).trim() || 'Non specificato';
}

// ============================================================
// TEMPLATE EMAIL — versione HTML (bella e leggibile)
// ============================================================
function buildEmailHtml(d) {
  const tonoDiVoce = d.tonoDiVoce || 'Non specificato';
  const obPrimario = d.obiettivoPrimario || 'Non specificato';
  const stile      = d.stileVisivo || 'Non specificato';
  const dominio    = d.dominio
    ? d.dominio + (d.dominioNome ? ` (${d.dominioNome})` : '')
    : 'Non specificato';
  const sitoEs     = d.sitoEsistente
    ? d.sitoEsistente + (d.sitoEsistenteUrl ? ` — ${d.sitoEsistenteUrl}` : '')
    : 'Non specificato';

  // Stile inline per massima compatibilità email client
  const CSS = {
    wrapper: 'font-family: -apple-system, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #f0f4f8; padding: 24px 16px;',
    card:    'background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);',
    header:  'background: #1a2744; color: #ffffff; padding: 32px 32px 28px; text-align: left;',
    h1:      'margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;',
    subtitle:'margin: 6px 0 0; font-size: 14px; color: rgba(255,255,255,0.7);',
    body:    'padding: 8px 0;',
    section: 'padding: 20px 32px; border-bottom: 1px solid #f0f4f8;',
    secHead: 'display: flex; align-items: center; gap: 8px; margin-bottom: 14px;',
    secNum:  'display: inline-block; width: 22px; height: 22px; border-radius: 50%; background: #1a2744; color: white; font-size: 11px; font-weight: 700; text-align: center; line-height: 22px;',
    secTitle:'font-size: 11px; font-weight: 700; color: #1a2744; text-transform: uppercase; letter-spacing: 0.08em; margin: 0;',
    row:     'display: flex; gap: 8px; padding: 5px 0; border-bottom: 1px solid #f8f8f8; font-size: 13.5px; line-height: 1.5;',
    key:     'color: #64748b; font-weight: 500; min-width: 170px; flex-shrink: 0;',
    val:     'color: #1e293b; word-break: break-word;',
    empty:   'color: #94a3b8; font-style: italic;',
    footer:  'padding: 20px 32px; font-size: 12px; color: #94a3b8; text-align: center; background: #f8fafc;',
    badge:   'display: inline-block; padding: 2px 8px; background: #eff6ff; color: #3b82f6; border-radius: 4px; font-size: 11px; font-weight: 600; margin-top: 4px;',
  };

  function row(key, value) {
    const isEmpty = !value || value === 'Non specificato';
    const valStyle = isEmpty ? CSS.empty : CSS.val;
    return `
      <div style="${CSS.row}">
        <span style="${CSS.key}">${esc(key)}</span>
        <span style="${valStyle}">${esc(value)}</span>
      </div>`;
  }

  function section(num, title, rows) {
    return `
      <div style="${CSS.section}">
        <div style="${CSS.secHead}">
          <span style="${CSS.secNum}">${num}</span>
          <p style="${CSS.secTitle}">${title}</p>
        </div>
        ${rows.join('')}
      </div>`;
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><title>Nuova richiesta discovery</title></head>
<body style="margin:0; padding:0; background:#f0f4f8;">
<div style="${CSS.wrapper}">
  <div style="${CSS.card}">

    <!-- Header -->
    <div style="${CSS.header}">
      <h1 style="${CSS.h1}">Nuova richiesta discovery</h1>
      <p style="${CSS.subtitle}">
        Da: <strong>${esc(d.nomeAttivita || 'Nuovo cliente')}</strong>
        &nbsp;·&nbsp;
        ${esc(d.dataInvio || new Date().toLocaleString('it-IT'))}
      </p>
    </div>

    <!-- Body -->
    <div style="${CSS.body}">

      ${section(1, 'Identità del progetto', [
        row('Tipo di attività',      display(d.tipoAttivita)),
        row('Nome / brand',          display(d.nomeAttivita)),
        row('Nicchia specifica',     display(d.nicchiaSpecifica)),
        row('Slogan / claim',        display(d.sloganClaim)),
        row('Tono di voce',          display(tonoDiVoce)),
        row('Lingue del sito',       display(d.lingue)),
      ])}

      ${section(2, 'Obiettivo e conversioni', [
        row('Obiettivo primario',    display(obPrimario)),
        row('Obiettivi secondari',   display(d.obiettiviSecondari)),
        row('Call to action',        display(d.callToAction)),
        row('Percorso utente',       display(d.percorsoUtente)),
        row('KPI di successo',       display(d.kpiSuccesso)),
      ])}

      ${section(3, 'Dati di contatto', [
        row('Indirizzo',             display(d.indirizzo)),
        row('Telefono / WhatsApp',   display(d.telefono)),
        row('Email di contatto',     display(d.emailContatto)),
        row('Orari di apertura',     display(d.orariApertura)),
        row('Google Maps',           display(d.googleMaps)),
        row('Social media',          display(d.socialMedia)),
        row('P.IVA / Ragione soc.',  display(d.pIva)),
        row('Certificazioni',        display(d.certificazioni)),
      ])}

      ${section(4, 'Contenuti e struttura', [
        row('Pagine desiderate',     display(d.pagine)),
        row('Servizi / prodotti',    display(d.serviziProdotti)),
        row('Testi pronti',          display(d.testiPronti)),
        row('Materiale fotografico', display(d.materialeFoto)),
        row('Recensioni',            display(d.recensioni)),
        row('FAQ clienti',           display(d.faq)),
      ])}

      ${section(5, 'Funzionalità richieste', [
        row('Funzionalità scelte',   display(d.funzionalita)),
      ])}

      ${section(6, 'Riferimenti estetici e brand', [
        row('Logo disponibile',      display(d.logoDisponibile)),
        row('Colori brand',          display(d.coloriBrand)),
        row('Font preferiti',        display(d.fontPreferiti)),
        row('Siti di ispirazione',   display(d.sitiIspirazione)),
        row('Siti concorrenti',      display(d.sitiConcorrenti)),
        row('Stile visivo',          display(stile)),
      ])}

      ${section(7, 'SEO e posizionamento', [
        row('Area geografica',       display(d.areaGeografica)),
        row('Parole chiave',         display(d.paroleChiave)),
        row('Concorrenti online',    display(d.concorrentiOnline)),
        row('Sito esistente',        display(sitoEs)),
        row('Google Business',       display(d.googleBusiness)),
      ])}

      ${section(8, 'Vincoli tecnici e legali', [
        row('Dominio',               display(dominio)),
        row('Budget',                display(d.budget)),
        row('Note privacy',          display(d.notePrivacy)),
        row('Per chi si fa',         display(d.perChiSiFa)),
      ])}

    </div><!-- /body -->

    <!-- Footer -->
    <div style="${CSS.footer}">
      Richiesta ricevuta il ${esc(d.dataInvio || '')} ·
      Rispondi a <a href="mailto:${esc(d.emailContatto)}" style="color:#3b82f6;">${esc(d.emailContatto)}</a>
    </div>

  </div><!-- /card -->
</div>
</body>
</html>`;
}

// ============================================================
// TEMPLATE EMAIL — versione testo piano (fallback)
// ============================================================
function buildEmailText(d) {
  const sep = '\n' + '─'.repeat(50) + '\n';
  const line = (key, val) => `${key}:\n${display(val)}\n`;

  const tonoDiVoce = d.tonoDiVoce || '';
  const obPrimario = d.obiettivoPrimario || '';
  const stile      = d.stileVisivo || '';
  const dominio    = d.dominio
    ? d.dominio + (d.dominioNome ? ` (${d.dominioNome})` : '') : '';
  const sitoEs     = d.sitoEsistente
    ? d.sitoEsistente + (d.sitoEsistenteUrl ? ` — ${d.sitoEsistenteUrl}` : '') : '';

  return `NUOVA RICHIESTA DISCOVERY
${d.nomeAttivita || 'Nuovo cliente'} — ${d.dataInvio || ''}
${'═'.repeat(50)}

01 — IDENTITÀ DEL PROGETTO
${sep}
${line('Tipo di attività', d.tipoAttivita)}
${line('Nome / brand', d.nomeAttivita)}
${line('Nicchia specifica', d.nicchiaSpecifica)}
${line('Slogan / claim', d.sloganClaim)}
${line('Tono di voce', tonoDiVoce)}
${line('Lingue del sito', d.lingue)}

02 — OBIETTIVO E CONVERSIONI
${sep}
${line('Obiettivo primario', obPrimario)}
${line('Obiettivi secondari', d.obiettiviSecondari)}
${line('Call to action', d.callToAction)}
${line('Percorso utente', d.percorsoUtente)}
${line('KPI di successo', d.kpiSuccesso)}

03 — DATI DI CONTATTO
${sep}
${line('Indirizzo', d.indirizzo)}
${line('Telefono / WhatsApp', d.telefono)}
${line('Email di contatto', d.emailContatto)}
${line('Orari di apertura', d.orariApertura)}
${line('Google Maps', d.googleMaps)}
${line('Social media', d.socialMedia)}
${line('P.IVA / Ragione sociale', d.pIva)}
${line('Certificazioni', d.certificazioni)}

04 — CONTENUTI E STRUTTURA
${sep}
${line('Pagine desiderate', d.pagine)}
${line('Servizi / prodotti', d.serviziProdotti)}
${line('Testi pronti', d.testiPronti)}
${line('Materiale fotografico', d.materialeFoto)}
${line('Recensioni', d.recensioni)}
${line('FAQ clienti', d.faq)}

05 — FUNZIONALITÀ RICHIESTE
${sep}
${line('Funzionalità scelte', d.funzionalita)}

06 — RIFERIMENTI ESTETICI E BRAND
${sep}
${line('Logo disponibile', d.logoDisponibile)}
${line('Colori brand', d.coloriBrand)}
${line('Font preferiti', d.fontPreferiti)}
${line('Siti di ispirazione', d.sitiIspirazione)}
${line('Siti concorrenti', d.sitiConcorrenti)}
${line('Stile visivo', stile)}

07 — SEO E POSIZIONAMENTO
${sep}
${line('Area geografica', d.areaGeografica)}
${line('Parole chiave', d.paroleChiave)}
${line('Concorrenti online', d.concorrentiOnline)}
${line('Sito esistente', sitoEs)}
${line('Google Business Profile', d.googleBusiness)}

08 — VINCOLI TECNICI E LEGALI
${sep}
${line('Dominio', dominio)}
${line('Budget', d.budget)}
${line('Note privacy', d.notePrivacy)}
${line('Per chi si fa', d.perChiSiFa)}

${'═'.repeat(50)}
Richiesta inviata il ${d.dataInvio || ''}
Rispondi a: ${d.emailContatto || 'non specificato'}
`;
}
