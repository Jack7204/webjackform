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
        from:     `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to:       [DEST_EMAIL],
        reply_to: data.clienteEmail || data.emailContatto || undefined,
        subject:  subject,
        html:     html,
        text:     text,
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
// TEMPLATE EMAIL — versione HTML
// ============================================================
function buildEmailHtml(d) {

  // Escape HTML per sicurezza, converte \n in <br>
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  // Valore da mostrare: null/vuoto → null (mostralo come —)
  function disp(v) {
    if (v === null || v === undefined || v === false || String(v).trim() === '') return null;
    return String(v).trim();
  }

  // Riga campo: "Label | Valore" — se vuoto mostra — in grigio
  function row(label, value) {
    const v = disp(value);
    return `
      <tr>
        <td style="padding:5px 18px 5px 0;color:#64748b;font-size:13px;font-weight:500;vertical-align:top;white-space:nowrap;width:44%;line-height:1.5;">${esc(label)}</td>
        <td style="padding:5px 0;${v ? 'color:#0f172a;' : 'color:#94a3b8;font-style:italic;'}font-size:13px;vertical-align:top;word-break:break-word;line-height:1.5;">${v ? esc(v) : '—'}</td>
      </tr>`;
  }

  // Blocco sezione con header stile "## Titolo"
  function section(title, rows) {
    return `
      <div style="padding:20px 32px;border-bottom:1px solid #f1f5f9;">
        <h2 style="margin:0 0 13px;font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.1em;padding-bottom:7px;border-bottom:1.5px solid #e2e8f0;">${esc(title)}</h2>
        <table style="width:100%;border-collapse:collapse;"><tbody>${rows.join('')}</tbody></table>
      </div>`;
  }

  // Valori compositi
  const dominio = d.dominio
    ? d.dominio + (d.dominioNome ? ` (${d.dominioNome})` : '')
    : '';
  const sitoEs = d.sitoEsistente
    ? d.sitoEsistente + (d.sitoEsistenteUrl ? ` — ${d.sitoEsistenteUrl}` : '')
    : '';

  // Box contatti cliente (in header)
  const hasClient = d.clienteNome || d.clienteEmail || d.clienteTelefono;
  const clientBox = hasClient ? `
    <div style="margin-top:14px;background:rgba(255,255,255,0.13);border-radius:8px;padding:11px 16px;font-size:13px;line-height:1.9;">
      <span style="display:block;color:rgba(255,255,255,0.5);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:3px;">Contatti cliente</span>
      ${d.clienteNome     ? `<span style="color:#fff;margin-right:16px;">&#x1F464; ${esc(d.clienteNome)}</span>` : ''}
      ${d.clienteEmail    ? `<a href="mailto:${esc(d.clienteEmail)}" style="color:#93c5fd;text-decoration:none;margin-right:16px;">&#x2709;&#xFE0F; ${esc(d.clienteEmail)}</a>` : ''}
      ${d.clienteTelefono ? `<span style="color:#fff;">&#x1F4DE; ${esc(d.clienteTelefono)}</span>` : ''}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><title>Nuova richiesta discovery</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:24px 16px;">
<div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

  <!-- Header -->
  <div style="background:#1a2744;padding:26px 32px 22px;">
    <h1 style="margin:0;font-size:19px;font-weight:700;letter-spacing:-0.02em;color:#fff;">Nuova richiesta discovery</h1>
    <p style="margin:5px 0 0;font-size:13px;color:rgba(255,255,255,0.65);">
      Progetto: <strong style="color:#fff;">${esc(d.nomeAttivita || '—')}</strong>
      &nbsp;&middot;&nbsp;${esc(d.dataInvio || new Date().toLocaleString('it-IT'))}
    </p>
    ${clientBox}
  </div>

  <!-- Sezioni -->
  ${section('Identit\u00e0', [
    row('Tipo di attivit\u00e0',     d.tipoAttivita),
    row('Nome attivit\u00e0/brand',  d.nomeAttivita),
    row('Nicchia specifica',         d.nicchiaSpecifica),
    row('Slogan/claim',              d.sloganClaim),
    row('Tono di voce',              d.tonoDiVoce),
    row('Lingua/e del sito',         d.lingue),
  ])}

  ${section('Obiettivo e conversione', [
    row('Obiettivo primario',         d.obiettivoPrimario),
    row('Obiettivi secondari',        d.obiettiviSecondari),
    row('CTA principale (testo esatto)', d.callToAction),
    row('Percorso utente ideale',     d.percorsoUtente),
    row('KPI di successo',            d.kpiSuccesso),
  ])}

  ${section('Dati di contatto', [
    row('Indirizzo completo',         d.indirizzo),
    row('Telefono/WhatsApp',          d.telefono),
    row('Email',                      d.emailContatto),
    row('Orari di apertura',          d.orariApertura),
    row('Maps/coordinate GPS',        d.googleMaps),
    row('Social media (link)',        d.socialMedia),
    row('P.IVA/Ragione sociale',      d.pIva),
    row('Certificazioni/premi',       d.certificazioni),
  ])}

  ${section('Contenuti e struttura', [
    row('Pagine richieste',           d.pagine),
    row('Servizi/prodotti',           d.serviziProdotti),
    row('Testi gi\u00e0 pronti',     d.testiPronti),
    row('Materiale fotografico',      d.materialeFoto),
    row('Recensioni/testimonianze',   d.recensioni),
    row('FAQ',                        d.faq),
  ])}

  ${section('Funzionalit\u00e0 richieste', [
    row('Funzionalit\u00e0 scelte',  d.funzionalita),
  ])}

  ${section('Estetica e brand', [
    row('Logo',                            d.logoDisponibile),
    row('Colori brand (HEX se noti)',       d.coloriBrand),
    row('Font preferiti',                  d.fontPreferiti),
    row('Siti di riferimento/ispirazione', d.sitiIspirazione),
    row('Concorrenti',                     d.sitiConcorrenti),
    row('Stile visivo desiderato',         d.stileVisivo),
  ])}

  ${section('SEO', [
    row('Area geografica target',        d.areaGeografica),
    row('Parole chiave principali',      d.paroleChiave),
    row('Concorrenti online diretti',    d.concorrentiOnline),
    row('Sito esistente da migrare',     sitoEs),
    row('Google Business Profile attivo', d.googleBusiness),
  ])}

  ${section('Vincoli tecnici e legali', [
    row('Dominio',                            dominio),
    row('Budget hosting/servizi a pagamento', d.budget),
    row('Note privacy/GDPR',                  d.notePrivacy),
    row('Cliente finale del progetto',        d.perChiSiFa),
  ])}

  <!-- Footer -->
  <div style="padding:14px 32px;background:#f8fafc;text-align:center;font-size:12px;color:#94a3b8;">
    Richiesta ricevuta il ${esc(d.dataInvio || '')}
    &nbsp;&middot;&nbsp;
    Rispondi a <a href="mailto:${esc(d.clienteEmail || d.emailContatto || '')}" style="color:#3b82f6;">${esc(d.clienteEmail || d.emailContatto || 'non specificato')}</a>
  </div>

</div>
</div>
</body>
</html>`;
}

// ============================================================
// TEMPLATE EMAIL — versione testo piano (fallback)
// ============================================================
function buildEmailText(d) {
  const dash = (v) => {
    if (v === null || v === undefined || v === false || String(v).trim() === '') return '—';
    return String(v).trim();
  };

  const line = (label, val) => `- ${label}: ${dash(val)}`;
  const sep  = '─'.repeat(52);

  const dominio = d.dominio
    ? d.dominio + (d.dominioNome ? ` (${d.dominioNome})` : '')
    : '';
  const sitoEs = d.sitoEsistente
    ? d.sitoEsistente + (d.sitoEsistenteUrl ? ` — ${d.sitoEsistenteUrl}` : '')
    : '';

  const clientLines = [
    d.clienteNome     && `Nome:     ${d.clienteNome}`,
    d.clienteEmail    && `Email:    ${d.clienteEmail}`,
    d.clienteTelefono && `Telefono: ${d.clienteTelefono}`,
  ].filter(Boolean);

  return `RICHIESTA DISCOVERY — ${d.nomeAttivita || 'Nuovo cliente'}
Data: ${d.dataInvio || ''}
${clientLines.length ? `\nCONTATTI CLIENTE\n${clientLines.join('\n')}\n` : ''}
${'═'.repeat(52)}

## Identità
${line('Tipo di attività',    d.tipoAttivita)}
${line('Nome attività/brand', d.nomeAttivita)}
${line('Nicchia specifica',   d.nicchiaSpecifica)}
${line('Slogan/claim',        d.sloganClaim)}
${line('Tono di voce',        d.tonoDiVoce)}
${line('Lingua/e del sito',   d.lingue)}

## Obiettivo e conversione
${line('Obiettivo primario',          d.obiettivoPrimario)}
${line('Obiettivi secondari',         d.obiettiviSecondari)}
${line('CTA principale (testo esatto)', d.callToAction)}
${line('Percorso utente ideale',      d.percorsoUtente)}
${line('KPI di successo',             d.kpiSuccesso)}

## Dati di contatto
${line('Indirizzo completo',    d.indirizzo)}
${line('Telefono/WhatsApp',     d.telefono)}
${line('Email',                 d.emailContatto)}
${line('Orari di apertura',     d.orariApertura)}
${line('Maps/coordinate GPS',   d.googleMaps)}
${line('Social media (link)',   d.socialMedia)}
${line('P.IVA/Ragione sociale', d.pIva)}
${line('Certificazioni/premi',  d.certificazioni)}

## Contenuti e struttura
${line('Pagine richieste',           d.pagine)}
${line('Servizi/prodotti',           d.serviziProdotti)}
${line('Testi già pronti',           d.testiPronti)}
${line('Materiale fotografico',      d.materialeFoto)}
${line('Recensioni/testimonianze',   d.recensioni)}
${line('FAQ',                        d.faq)}

## Funzionalità richieste
${line('Funzionalità scelte', d.funzionalita)}

## Estetica e brand
${line('Logo',                            d.logoDisponibile)}
${line('Colori brand (HEX se noti)',       d.coloriBrand)}
${line('Font preferiti',                  d.fontPreferiti)}
${line('Siti di riferimento/ispirazione', d.sitiIspirazione)}
${line('Concorrenti',                     d.sitiConcorrenti)}
${line('Stile visivo desiderato',         d.stileVisivo)}

## SEO
${line('Area geografica target',        d.areaGeografica)}
${line('Parole chiave principali',      d.paroleChiave)}
${line('Concorrenti online diretti',    d.concorrentiOnline)}
${line('Sito esistente da migrare',     sitoEs)}
${line('Google Business Profile attivo', d.googleBusiness)}

## Vincoli tecnici e legali
${line('Dominio',                            dominio)}
${line('Budget hosting/servizi a pagamento', d.budget)}
${line('Note privacy/GDPR',                  d.notePrivacy)}
${line('Cliente finale del progetto',        d.perChiSiFa)}

${'═'.repeat(52)}
Richiesta inviata il ${d.dataInvio || ''}
Rispondi a: ${d.clienteEmail || d.emailContatto || 'non specificato'}
`;
}
