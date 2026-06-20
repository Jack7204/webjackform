/* ============================================================
   FORM DISCOVERY CLIENTI — Wizard Logic
   Flusso: 8 step → validazione → invio a Netlify Forms
   (fallback) + Netlify Function → Resend (email formattata)
============================================================ */

'use strict';

// ============================================================
// 1. STATO GLOBALE — tutti i dati del form vivono qui
// ============================================================
const formData = {
  // Step 1
  tipoAttivita: '',
  nomeAttivita: '',
  nicchiaSpecifica: '',
  sloganClaim: '',
  tonoDiVoce: '',
  tonoDiVoceAltro: '',
  linguaItaliano: false,
  linguaInglese: false,
  linguaAltro: false,
  linguaAltroText: '',
  // Step 2
  obiettivoPrimario: '',
  obiettivoPrimarioAltro: '',
  obSecNewsletter: false,
  obSecRecensioni: false,
  obSecSocial: false,
  obSecAltro: false,
  obSecAltroText: '',
  callToAction: '',
  percorsoUtente: '',
  kpiSuccesso: '',
  // Step 3
  indirizzo: '',
  telefono: '',
  emailContatto: '',
  orariApertura: '',
  googleMaps: '',
  socialMedia: '',
  pIva: '',
  certificazioni: '',
  // Step 4
  pagHome: false,
  pagChiSiamo: false,
  pagMenuServizi: false,
  pagGalleria: false,
  pagCamere: false,
  pagPrezzi: false,
  pagBlog: false,
  pagContatti: false,
  pagAltro: false,
  pagAltroText: '',
  serviziProdotti: '',
  testiPronti: '',
  materialeFoto: '',
  recensioni: '',
  faq: '',
  // Step 5
  funzVetrina: false,
  funzBlog: false,
  funzBooking: false,
  funzEcommerce: false,
  funzGalleria: false,
  funzMappa: false,
  funzWhatsapp: false,
  funzNewsletter: false,
  funzMultilingua: false,
  funzAltro: false,
  funzAltroText: '',
  // Step 6
  logoDisponibile: '',
  coloriBrand: '',
  fontPreferiti: '',
  sitiIspirazione: '',
  sitiConcorrenti: '',
  stileVisivo: '',
  stileVisivoAltro: '',
  // Step 7
  areaGeografica: '',
  paroleChiave: '',
  concorrentiOnline: '',
  sitoEsistente: '',
  sitoEsistenteUrl: '',
  googleBusiness: '',
  // Step 8
  dominio: '',
  dominioNome: '',
  budget: '',
  notePrivacy: '',
  perChiSiFa: '',
};

// Step tracker
let currentStep = 1;
const TOTAL_STEPS = 8;

const STEP_TITLES = {
  1: 'Identità del progetto',
  2: 'Obiettivo e conversioni',
  3: 'Dati di contatto',
  4: 'Contenuti e struttura',
  5: 'Funzionalità richieste',
  6: 'Riferimenti estetici',
  7: 'SEO e posizionamento',
  8: 'Vincoli e riepilogo',
};

// ============================================================
// 2. UTILITY — lettura/scrittura DOM
// ============================================================
const $ = id => document.getElementById(id);

function getVal(id) {
  const el = $(id);
  return el ? el.value.trim() : '';
}

function setVal(id, val) {
  const el = $(id);
  if (el) el.value = val || '';
}

function getChecked(id) {
  const el = $(id);
  return el ? el.checked : false;
}

function setChecked(id, val) {
  const el = $(id);
  if (el) el.checked = !!val;
}

function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function setRadio(name, val) {
  if (!val) return;
  const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
  if (el) el.checked = true;
}

// Mostra/nascondi campo condizionale
function toggleConditional(wrapperId, visible) {
  const el = $(wrapperId);
  if (!el) return;
  el.classList.toggle('visible', !!visible);
}

// ============================================================
// 3. SALVA E RIPRISTINA DATI PER STEP
// ============================================================

function saveStep1() {
  formData.tipoAttivita     = getVal('tipo-attivita');
  formData.nomeAttivita     = getVal('nome-attivita');
  formData.nicchiaSpecifica = getVal('nicchia-specifica');
  formData.sloganClaim      = getVal('slogan-claim');
  formData.tonoDiVoce       = getVal('tono-di-voce');
  formData.tonoDiVoceAltro  = getVal('tono-di-voce-altro');
  formData.linguaItaliano   = getChecked('lingua-italiano');
  formData.linguaInglese    = getChecked('lingua-inglese');
  formData.linguaAltro      = getChecked('lingua-altro');
  formData.linguaAltroText  = getVal('lingua-altro-text');
}

function restoreStep1() {
  setVal('tipo-attivita',       formData.tipoAttivita);
  setVal('nome-attivita',       formData.nomeAttivita);
  setVal('nicchia-specifica',   formData.nicchiaSpecifica);
  setVal('slogan-claim',        formData.sloganClaim);
  setVal('tono-di-voce',        formData.tonoDiVoce);
  setVal('tono-di-voce-altro',  formData.tonoDiVoceAltro);
  setChecked('lingua-italiano', formData.linguaItaliano);
  setChecked('lingua-inglese',  formData.linguaInglese);
  setChecked('lingua-altro',    formData.linguaAltro);
  setVal('lingua-altro-text',   formData.linguaAltroText);
  toggleConditional('cond-tono-altro',  formData.tonoDiVoce === 'altro');
  toggleConditional('cond-lingua-altro', formData.linguaAltro);
}

function saveStep2() {
  formData.obiettivoPrimario      = getVal('obiettivo-primario');
  formData.obiettivoPrimarioAltro = getVal('obiettivo-primario-altro');
  formData.obSecNewsletter        = getChecked('ob-sec-newsletter');
  formData.obSecRecensioni        = getChecked('ob-sec-recensioni');
  formData.obSecSocial            = getChecked('ob-sec-social');
  formData.obSecAltro             = getChecked('ob-sec-altro');
  formData.obSecAltroText         = getVal('ob-sec-altro-text');
  formData.callToAction           = getVal('call-to-action');
  formData.percorsoUtente         = getVal('percorso-utente');
  formData.kpiSuccesso            = getVal('kpi-successo');
}

function restoreStep2() {
  setVal('obiettivo-primario',      formData.obiettivoPrimario);
  setVal('obiettivo-primario-altro', formData.obiettivoPrimarioAltro);
  setChecked('ob-sec-newsletter',   formData.obSecNewsletter);
  setChecked('ob-sec-recensioni',   formData.obSecRecensioni);
  setChecked('ob-sec-social',       formData.obSecSocial);
  setChecked('ob-sec-altro',        formData.obSecAltro);
  setVal('ob-sec-altro-text',       formData.obSecAltroText);
  setVal('call-to-action',          formData.callToAction);
  setVal('percorso-utente',         formData.percorsoUtente);
  setVal('kpi-successo',            formData.kpiSuccesso);
  toggleConditional('cond-obiettivo-altro', formData.obiettivoPrimario === 'altro');
  toggleConditional('cond-ob-sec-altro',    formData.obSecAltro);
}

function saveStep3() {
  formData.indirizzo     = getVal('indirizzo');
  formData.telefono      = getVal('telefono');
  formData.emailContatto = getVal('email-contatto');
  formData.orariApertura = getVal('orari-apertura');
  formData.googleMaps    = getVal('google-maps');
  formData.socialMedia   = getVal('social-media');
  formData.pIva          = getVal('p-iva');
  formData.certificazioni = getVal('certificazioni');
}

function restoreStep3() {
  setVal('indirizzo',      formData.indirizzo);
  setVal('telefono',       formData.telefono);
  setVal('email-contatto', formData.emailContatto);
  setVal('orari-apertura', formData.orariApertura);
  setVal('google-maps',    formData.googleMaps);
  setVal('social-media',   formData.socialMedia);
  setVal('p-iva',          formData.pIva);
  setVal('certificazioni', formData.certificazioni);
}

function saveStep4() {
  formData.pagHome        = getChecked('pag-home');
  formData.pagChiSiamo    = getChecked('pag-chi-siamo');
  formData.pagMenuServizi = getChecked('pag-menu-servizi');
  formData.pagGalleria    = getChecked('pag-galleria');
  formData.pagCamere      = getChecked('pag-camere');
  formData.pagPrezzi      = getChecked('pag-prezzi');
  formData.pagBlog        = getChecked('pag-blog');
  formData.pagContatti    = getChecked('pag-contatti');
  formData.pagAltro       = getChecked('pag-altro');
  formData.pagAltroText   = getVal('pag-altro-text');
  formData.serviziProdotti = getVal('servizi-prodotti');
  formData.testiPronti    = getRadio('testi-pronti');
  formData.materialeFoto  = getRadio('materiale-foto');
  formData.recensioni     = getVal('recensioni');
  formData.faq            = getVal('faq');
}

function restoreStep4() {
  setChecked('pag-home',        formData.pagHome);
  setChecked('pag-chi-siamo',   formData.pagChiSiamo);
  setChecked('pag-menu-servizi', formData.pagMenuServizi);
  setChecked('pag-galleria',    formData.pagGalleria);
  setChecked('pag-camere',      formData.pagCamere);
  setChecked('pag-prezzi',      formData.pagPrezzi);
  setChecked('pag-blog',        formData.pagBlog);
  setChecked('pag-contatti',    formData.pagContatti);
  setChecked('pag-altro',       formData.pagAltro);
  setVal('pag-altro-text',      formData.pagAltroText);
  setVal('servizi-prodotti',    formData.serviziProdotti);
  setRadio('testi-pronti',      formData.testiPronti);
  setRadio('materiale-foto',    formData.materialeFoto);
  setVal('recensioni',          formData.recensioni);
  setVal('faq',                 formData.faq);
  toggleConditional('cond-pag-altro', formData.pagAltro);
}

function saveStep5() {
  formData.funzVetrina    = getChecked('funz-vetrina');
  formData.funzBlog       = getChecked('funz-blog');
  formData.funzBooking    = getChecked('funz-booking');
  formData.funzEcommerce  = getChecked('funz-ecommerce');
  formData.funzGalleria   = getChecked('funz-galleria');
  formData.funzMappa      = getChecked('funz-mappa');
  formData.funzWhatsapp   = getChecked('funz-whatsapp');
  formData.funzNewsletter = getChecked('funz-newsletter');
  formData.funzMultilingua = getChecked('funz-multilingua');
  formData.funzAltro      = getChecked('funz-altro');
  formData.funzAltroText  = getVal('funz-altro-text');
}

function restoreStep5() {
  setChecked('funz-vetrina',    formData.funzVetrina);
  setChecked('funz-blog',       formData.funzBlog);
  setChecked('funz-booking',    formData.funzBooking);
  setChecked('funz-ecommerce',  formData.funzEcommerce);
  setChecked('funz-galleria',   formData.funzGalleria);
  setChecked('funz-mappa',      formData.funzMappa);
  setChecked('funz-whatsapp',   formData.funzWhatsapp);
  setChecked('funz-newsletter', formData.funzNewsletter);
  setChecked('funz-multilingua', formData.funzMultilingua);
  setChecked('funz-altro',      formData.funzAltro);
  setVal('funz-altro-text',     formData.funzAltroText);
  toggleConditional('cond-funz-altro', formData.funzAltro);
}

function saveStep6() {
  formData.logoDisponibile = getRadio('logo-disponibile');
  formData.coloriBrand     = getVal('colori-brand');
  formData.fontPreferiti   = getVal('font-preferiti');
  formData.sitiIspirazione = getVal('siti-ispirazione');
  formData.sitiConcorrenti = getVal('siti-concorrenti');
  formData.stileVisivo     = getVal('stile-visivo');
  formData.stileVisivoAltro = getVal('stile-visivo-altro');
}

function restoreStep6() {
  setRadio('logo-disponibile',   formData.logoDisponibile);
  setVal('colori-brand',         formData.coloriBrand);
  setVal('font-preferiti',       formData.fontPreferiti);
  setVal('siti-ispirazione',     formData.sitiIspirazione);
  setVal('siti-concorrenti',     formData.sitiConcorrenti);
  setVal('stile-visivo',         formData.stileVisivo);
  setVal('stile-visivo-altro',   formData.stileVisivoAltro);
  toggleConditional('cond-stile-altro', formData.stileVisivo === 'altro');
}

function saveStep7() {
  formData.areaGeografica   = getVal('area-geografica');
  formData.paroleChiave     = getVal('parole-chiave');
  formData.concorrentiOnline = getVal('concorrenti-online');
  formData.sitoEsistente    = getRadio('sito-esistente');
  formData.sitoEsistenteUrl = getVal('sito-esistente-url');
  formData.googleBusiness   = getRadio('google-business');
}

function restoreStep7() {
  setVal('area-geografica',    formData.areaGeografica);
  setVal('parole-chiave',      formData.paroleChiave);
  setVal('concorrenti-online', formData.concorrentiOnline);
  setRadio('sito-esistente',   formData.sitoEsistente);
  setVal('sito-esistente-url', formData.sitoEsistenteUrl);
  setRadio('google-business',  formData.googleBusiness);
  toggleConditional('cond-sito-url', formData.sitoEsistente === 'Sì');
}

function saveStep8() {
  formData.dominio     = getRadio('dominio');
  formData.dominioNome = getVal('dominio-nome');
  formData.budget      = getRadio('budget');
  formData.notePrivacy = getVal('note-privacy');
  formData.perChiSiFa  = getVal('per-chi-si-fa');
}

function restoreStep8() {
  setRadio('dominio',      formData.dominio);
  setVal('dominio-nome',   formData.dominioNome);
  setRadio('budget',       formData.budget);
  setVal('note-privacy',   formData.notePrivacy);
  setVal('per-chi-si-fa',  formData.perChiSiFa);
  toggleConditional('cond-dominio-nome', formData.dominio === 'Già posseduto');
}

const saveFns    = { 1: saveStep1, 2: saveStep2, 3: saveStep3, 4: saveStep4,
                     5: saveStep5, 6: saveStep6, 7: saveStep7, 8: saveStep8 };
const restoreFns = { 1: restoreStep1, 2: restoreStep2, 3: restoreStep3, 4: restoreStep4,
                     5: restoreStep5, 6: restoreStep6, 7: restoreStep7, 8: restoreStep8 };

// ============================================================
// 4. VALIDAZIONE PER STEP
// ============================================================

// Marca/deseleziona un form-group come errore
function setError(groupId, hasError) {
  const group = document.querySelector(`#step-${currentStep} #${groupId}`)?.closest('.form-group');
  if (!group) return;
  group.classList.toggle('has-error', hasError);
}

function validateEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function validateTel(val) {
  if (!val) return true; // optional
  return /^[\d\s\+\-\(\)]{6,20}$/.test(val);
}

// Ritorna true se lo step è valido, false altrimenti
function validateStep(step) {
  let valid = true;

  if (step === 1) {
    const nome = getVal('nome-attivita');
    const hasError = !nome;
    setError('nome-attivita', hasError);
    if (hasError) valid = false;
  }

  if (step === 2) {
    const ob = getVal('obiettivo-primario');
    const hasError = !ob;
    setError('obiettivo-primario', hasError);
    if (hasError) valid = false;
  }

  if (step === 3) {
    const email = getVal('email-contatto');
    const emailOk = email && validateEmail(email);
    setError('email-contatto', !emailOk);
    if (!emailOk) valid = false;

    const tel = getVal('telefono');
    const telOk = validateTel(tel);
    setError('telefono', !telOk);
    if (!telOk) valid = false;
  }

  return valid;
}

// ============================================================
// 5. PROGRESS BAR
// ============================================================
function updateProgress() {
  const pct = Math.round((currentStep / TOTAL_STEPS) * 100);
  $('progressFill').style.width = `${pct}%`;
  $('progressPercent').textContent = `${pct}%`;
  $('currentStep').textContent = currentStep;
  $('stepTitle').textContent = STEP_TITLES[currentStep];
}

// ============================================================
// 6. NAVIGAZIONE WIZARD
// ============================================================
function showStep(step, direction) {
  // Nascondi tutti gli step e gli schermi esito
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  $('wizardNav').style.display = 'flex';

  const stepEl = $(`step-${step}`);
  stepEl.classList.add('active');

  // Bottoni navigazione
  $('btnBack').style.visibility = step === 1 ? 'hidden' : 'visible';
  // Sull'ultimo step "Avanti" scompare — il submit è nel contenuto dello step
  $('btnNext').hidden = step === TOTAL_STEPS;
  if (step === TOTAL_STEPS) {
    generateSummary();
  }

  currentStep = step;
  updateProgress();

  // Scroll verso la barra di progresso
  $('wizardTop').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function nextStep() {
  // Salva prima di validare (per non perdere i dati)
  if (saveFns[currentStep]) saveFns[currentStep]();
  if (!validateStep(currentStep)) return;
  if (currentStep < TOTAL_STEPS) showStep(currentStep + 1, 'forward');
}

function prevStep() {
  if (saveFns[currentStep]) saveFns[currentStep]();
  if (currentStep > 1) showStep(currentStep - 1, 'back');
}

function goToStep(step) {
  if (saveFns[currentStep]) saveFns[currentStep]();
  showStep(step, 'back');
  // Ripristina i dati dopo che il DOM è visibile
  requestAnimationFrame(() => {
    if (restoreFns[step]) restoreFns[step]();
  });
}

// ============================================================
// 7. GESTIONE CAMPI CONDIZIONALI (real-time)
// ============================================================
function initConditionals() {
  // Tono di voce → "Altro"
  $('tono-di-voce')?.addEventListener('change', e => {
    toggleConditional('cond-tono-altro', e.target.value === 'altro');
  });

  // Lingua Altro checkbox
  $('lingua-altro')?.addEventListener('change', e => {
    toggleConditional('cond-lingua-altro', e.target.checked);
  });

  // Obiettivo primario → "Altro"
  $('obiettivo-primario')?.addEventListener('change', e => {
    toggleConditional('cond-obiettivo-altro', e.target.value === 'altro');
  });

  // Obiettivi secondari → "Altro"
  $('ob-sec-altro')?.addEventListener('change', e => {
    toggleConditional('cond-ob-sec-altro', e.target.checked);
  });

  // Pagine → "Altro"
  $('pag-altro')?.addEventListener('change', e => {
    toggleConditional('cond-pag-altro', e.target.checked);
  });

  // Funzionalità → "Altro"
  $('funz-altro')?.addEventListener('change', e => {
    toggleConditional('cond-funz-altro', e.target.checked);
  });

  // Stile visivo → "Altro"
  $('stile-visivo')?.addEventListener('change', e => {
    toggleConditional('cond-stile-altro', e.target.value === 'altro');
  });

  // Sito esistente → URL
  document.querySelectorAll('input[name="sito-esistente"]').forEach(radio => {
    radio.addEventListener('change', e => {
      toggleConditional('cond-sito-url', e.target.value === 'Sì');
    });
  });

  // Dominio → campo nome dominio
  document.querySelectorAll('input[name="dominio"]').forEach(radio => {
    radio.addEventListener('change', e => {
      toggleConditional('cond-dominio-nome', e.target.value === 'Già posseduto');
    });
  });
}

// ============================================================
// 8. GENERAZIONE RIEPILOGO (Step 8)
// ============================================================
function val(v) {
  if (v === null || v === undefined || v === '') return '<em class="empty">Non specificato</em>';
  if (typeof v === 'boolean') return v ? 'Sì' : 'No';
  return escapeHtml(String(v));
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildSection(num, title, rows) {
  const rowsHtml = rows
    .map(([k, v]) => `
      <div class="summary-row">
        <span class="summary-key">${escapeHtml(k)}</span>
        <span class="summary-val ${v === '<em class="empty">Non specificato</em>' ? 'empty' : ''}">${v}</span>
      </div>`)
    .join('');

  return `
    <div class="summary-section">
      <div class="summary-section-header">
        <span class="summary-section-title">
          <span class="summary-section-num">${num}</span>
          ${escapeHtml(title)}
        </span>
        <button class="summary-edit-btn" onclick="goToStep(${num})">Modifica</button>
      </div>
      <div class="summary-rows">${rowsHtml}</div>
    </div>`;
}

function buildLingue() {
  const lingue = [];
  if (formData.linguaItaliano) lingue.push('Italiano');
  if (formData.linguaInglese)  lingue.push('Inglese');
  if (formData.linguaAltro && formData.linguaAltroText) lingue.push(formData.linguaAltroText);
  return lingue.length ? lingue.join(', ') : '';
}

function buildObiettiviSec() {
  const sec = [];
  if (formData.obSecNewsletter) sec.push('Iscrizione newsletter');
  if (formData.obSecRecensioni) sec.push('Recensioni Google');
  if (formData.obSecSocial)     sec.push('Follow social');
  if (formData.obSecAltro && formData.obSecAltroText) sec.push(formData.obSecAltroText);
  return sec.length ? sec.join(', ') : '';
}

function buildPagine() {
  const pag = [];
  if (formData.pagHome)        pag.push('Home');
  if (formData.pagChiSiamo)    pag.push('Chi siamo');
  if (formData.pagMenuServizi) pag.push('Menu/Servizi');
  if (formData.pagGalleria)    pag.push('Galleria');
  if (formData.pagCamere)      pag.push('Camere');
  if (formData.pagPrezzi)      pag.push('Prezzi');
  if (formData.pagBlog)        pag.push('Blog');
  if (formData.pagContatti)    pag.push('Contatti');
  if (formData.pagAltro && formData.pagAltroText) pag.push(formData.pagAltroText);
  return pag.length ? pag.join(', ') : '';
}

function buildFunzionalita() {
  const f = [];
  if (formData.funzVetrina)    f.push('Sito vetrina + form contatto');
  if (formData.funzBlog)       f.push('Blog/news');
  if (formData.funzBooking)    f.push('Prenotazione/booking');
  if (formData.funzEcommerce)  f.push('E-commerce');
  if (formData.funzGalleria)   f.push('Galleria dinamica');
  if (formData.funzMappa)      f.push('Mappa interattiva');
  if (formData.funzWhatsapp)   f.push('WhatsApp Business');
  if (formData.funzNewsletter) f.push('Newsletter');
  if (formData.funzMultilingua) f.push('Area multilingua');
  if (formData.funzAltro && formData.funzAltroText) f.push(formData.funzAltroText);
  return f.length ? f.join(', ') : '';
}

function generateSummary() {
  // Salva lo stato corrente prima di generare il riepilogo
  if (saveFns[currentStep]) saveFns[currentStep]();

  const tonoDiVoce = formData.tonoDiVoce === 'altro'
    ? formData.tonoDiVoceAltro || 'Altro'
    : formData.tonoDiVoce;

  const obPrimario = formData.obiettivoPrimario === 'altro'
    ? formData.obiettivoPrimarioAltro || 'Altro'
    : formData.obiettivoPrimario;

  const stile = formData.stileVisivo === 'altro'
    ? formData.stileVisivoAltro || 'Altro'
    : formData.stileVisivo;

  const html = [
    buildSection(1, STEP_TITLES[1], [
      ['Tipo di attività',     val(formData.tipoAttivita)],
      ['Nome / brand',         val(formData.nomeAttivita)],
      ['Nicchia specifica',    val(formData.nicchiaSpecifica)],
      ['Slogan / claim',       val(formData.sloganClaim)],
      ['Tono di voce',         val(tonoDiVoce)],
      ['Lingue del sito',      val(buildLingue())],
    ]),
    buildSection(2, STEP_TITLES[2], [
      ['Obiettivo primario',   val(obPrimario)],
      ['Obiettivi secondari',  val(buildObiettiviSec())],
      ['Call to action',       val(formData.callToAction)],
      ['Percorso utente',      val(formData.percorsoUtente)],
      ['KPI di successo',      val(formData.kpiSuccesso)],
    ]),
    buildSection(3, STEP_TITLES[3], [
      ['Indirizzo',            val(formData.indirizzo)],
      ['Telefono / WhatsApp',  val(formData.telefono)],
      ['Email di contatto',    val(formData.emailContatto)],
      ['Orari di apertura',    val(formData.orariApertura)],
      ['Google Maps',          val(formData.googleMaps)],
      ['Social media',         val(formData.socialMedia)],
      ['P.IVA / Ragione soc.', val(formData.pIva)],
      ['Certificazioni',       val(formData.certificazioni)],
    ]),
    buildSection(4, STEP_TITLES[4], [
      ['Pagine desiderate',    val(buildPagine())],
      ['Servizi / prodotti',   val(formData.serviziProdotti)],
      ['Testi pronti',         val(formData.testiPronti)],
      ['Materiale fotografico', val(formData.materialeFoto)],
      ['Recensioni',           val(formData.recensioni)],
      ['FAQ clienti',          val(formData.faq)],
    ]),
    buildSection(5, STEP_TITLES[5], [
      ['Funzionalità richieste', val(buildFunzionalita())],
    ]),
    buildSection(6, STEP_TITLES[6], [
      ['Logo disponibile',     val(formData.logoDisponibile)],
      ['Colori brand',         val(formData.coloriBrand)],
      ['Font preferiti',       val(formData.fontPreferiti)],
      ['Siti di ispirazione',  val(formData.sitiIspirazione)],
      ['Siti concorrenti',     val(formData.sitiConcorrenti)],
      ['Stile visivo',         val(stile)],
    ]),
    buildSection(7, STEP_TITLES[7], [
      ['Area geografica',      val(formData.areaGeografica)],
      ['Parole chiave',        val(formData.paroleChiave)],
      ['Concorrenti online',   val(formData.concorrentiOnline)],
      ['Sito esistente',       val(formData.sitoEsistente)],
      ['URL sito esistente',   val(formData.sitoEsistenteUrl)],
      ['Google Business',      val(formData.googleBusiness)],
    ]),
    buildSection(8, STEP_TITLES[8], [
      ['Dominio',              val(formData.dominio === 'Già posseduto'
                                 ? `Già posseduto: ${formData.dominioNome || '—'}`
                                 : formData.dominio)],
      ['Budget',               val(formData.budget)],
      ['Note privacy',         val(formData.notePrivacy)],
      ['Per chi si fa',        val(formData.perChiSiFa)],
    ]),
  ].join('');

  $('summarySections').innerHTML = html;
}

// ============================================================
// 9. INVIO FORM
// ============================================================

// 9a. Converte formData in URLSearchParams per Netlify Forms
function buildNetlifyPayload() {
  const params = new URLSearchParams();
  params.set('form-name', 'discovery-form');
  params.set('bot-field', $('botField')?.value || '');

  // Mappa chiave leggibile → valore
  const tonoDiVoce = formData.tonoDiVoce === 'altro'
    ? formData.tonoDiVoceAltro : formData.tonoDiVoce;
  const obPrimario = formData.obiettivoPrimario === 'altro'
    ? formData.obiettivoPrimarioAltro : formData.obiettivoPrimario;
  const stile = formData.stileVisivo === 'altro'
    ? formData.stileVisivoAltro : formData.stileVisivo;

  const fields = {
    'tipo-attivita':        formData.tipoAttivita,
    'nome-attivita':        formData.nomeAttivita,
    'nicchia-specifica':    formData.nicchiaSpecifica,
    'slogan-claim':         formData.sloganClaim,
    'tono-di-voce':         tonoDiVoce,
    'lingue':               buildLingue(),
    'obiettivo-primario':   obPrimario,
    'obiettivi-secondari':  buildObiettiviSec(),
    'call-to-action':       formData.callToAction,
    'percorso-utente':      formData.percorsoUtente,
    'kpi-successo':         formData.kpiSuccesso,
    'indirizzo':            formData.indirizzo,
    'telefono':             formData.telefono,
    'email-contatto':       formData.emailContatto,
    'orari-apertura':       formData.orariApertura,
    'google-maps':          formData.googleMaps,
    'social-media':         formData.socialMedia,
    'p-iva':                formData.pIva,
    'certificazioni':       formData.certificazioni,
    'pagine-desiderate':    buildPagine(),
    'servizi-prodotti':     formData.serviziProdotti,
    'testi-pronti':         formData.testiPronti,
    'materiale-fotografico': formData.materialeFoto,
    'recensioni':           formData.recensioni,
    'faq':                  formData.faq,
    'funzionalita':         buildFunzionalita(),
    'logo-disponibile':     formData.logoDisponibile,
    'colori-brand':         formData.coloriBrand,
    'font-preferiti':       formData.fontPreferiti,
    'siti-ispirazione':     formData.sitiIspirazione,
    'siti-concorrenti':     formData.sitiConcorrenti,
    'stile-visivo':         stile,
    'area-geografica':      formData.areaGeografica,
    'parole-chiave':        formData.paroleChiave,
    'concorrenti-online':   formData.concorrentiOnline,
    'sito-esistente':       formData.sitoEsistente
                              + (formData.sitoEsistenteUrl ? ` — ${formData.sitoEsistenteUrl}` : ''),
    'google-business':      formData.googleBusiness,
    'dominio':              formData.dominio
                              + (formData.dominioNome ? ` (${formData.dominioNome})` : ''),
    'budget':               formData.budget,
    'note-privacy':         formData.notePrivacy,
    'per-chi-si-fa':        formData.perChiSiFa,
    'data-invio':           new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }),
  };

  Object.entries(fields).forEach(([k, v]) => params.set(k, v || ''));
  return params;
}

// 9b. Invio a Netlify Forms (fallback)
async function submitToNetlify() {
  try {
    const res = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: buildNetlifyPayload().toString(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 9c. Invio email formattata via Netlify Function + Resend
async function submitEmail() {
  // Prepara payload JSON per la Function
  const tonoDiVoce = formData.tonoDiVoce === 'altro'
    ? formData.tonoDiVoceAltro : formData.tonoDiVoce;
  const obPrimario = formData.obiettivoPrimario === 'altro'
    ? formData.obiettivoPrimarioAltro : formData.obiettivoPrimario;
  const stile = formData.stileVisivo === 'altro'
    ? formData.stileVisivoAltro : formData.stileVisivo;

  const payload = {
    ...formData,
    // Campi "risolti" (senza "altro")
    tonoDiVoce,
    obiettivoPrimario: obPrimario,
    stileVisivo: stile,
    // Liste concatenate
    lingue:            buildLingue(),
    obiettiviSecondari: buildObiettiviSec(),
    pagine:            buildPagine(),
    funzionalita:      buildFunzionalita(),
    // Timestamp
    dataInvio: new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' }),
  };

  try {
    const res = await fetch('/.netlify/functions/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 9d. Honeypot check — se il campo è compilato, è quasi certamente un bot
function isBotSubmission() {
  return !!($('botField')?.value);
}

// 9e. Funzione principale di invio
async function submitForm() {
  if (isBotSubmission()) {
    // Simula successo per non rivelare la protezione anti-bot
    showSuccess();
    return;
  }

  // Salva lo step 8 prima dell'invio
  saveStep8();

  // Mostra stato loading
  const btnSubmit = $('btnSubmit');
  btnSubmit.classList.add('loading');
  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Invio in corso…';

  // Invio parallelo: Netlify Forms (fallback) + email Function
  const [netlifyOk, emailOk] = await Promise.all([
    submitToNetlify(),
    submitEmail(),
  ]);

  btnSubmit.classList.remove('loading');
  btnSubmit.disabled = false;

  if (netlifyOk || emailOk) {
    showSuccess();
  } else {
    showError(
      'Impossibile contattare il server. Verifica la connessione Internet e riprova.'
    );
  }
}

// ============================================================
// 10. SCHERMATE ESITO
// ============================================================
function showSuccess() {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  $('step-success').classList.add('active');
  $('wizardNav').style.display = 'none';
  $('wizardTop').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(msg) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  $('step-error').classList.add('active');
  $('wizardNav').style.display = 'none';
  if (msg) $('errorDetail').textContent = msg;
  $('wizardTop').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  // Ripristina tutti i valori predefiniti
  Object.keys(formData).forEach(k => {
    formData[k] = typeof formData[k] === 'boolean' ? false : '';
  });
  // Torna allo step 1
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  $('wizardNav').style.display = 'flex';
  // Pulisci i campi DOM
  document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea, select')
    .forEach(el => { el.value = ''; });
  document.querySelectorAll('input[type="checkbox"], input[type="radio"]')
    .forEach(el => { el.checked = false; });
  document.querySelectorAll('.conditional.visible')
    .forEach(el => el.classList.remove('visible'));
  document.querySelectorAll('.form-group.has-error')
    .forEach(el => el.classList.remove('has-error'));
  showStep(1);
}

// ============================================================
// 11. INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Imposta stato iniziale
  showStep(1);
  updateProgress();
  initConditionals();

  // Navigazione
  $('btnNext').addEventListener('click', nextStep);
  $('btnBack').addEventListener('click', prevStep);
  $('btnSubmit').addEventListener('click', submitForm);

  // Pulsanti schermate esito
  $('btnNuovo').addEventListener('click', resetForm);
  $('btnRetry').addEventListener('click', submitForm);
  $('btnRetryManual').addEventListener('click', () => {
    $('step-error').classList.remove('active');
    $('wizardNav').style.display = 'flex';
    showStep(TOTAL_STEPS);
  });

  // Rimuovi errore live mentre l'utente digita
  document.querySelectorAll('[data-required], [data-validate]').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.form-group')?.classList.remove('has-error');
    });
  });
});
