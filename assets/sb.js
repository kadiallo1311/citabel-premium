/**
 * CITABEL — Supabase integration
 * Client public (anon) — formulaire de contact uniquement.
 * Les données sont stockées dans public.citabel_contacts.
 * Accès admin : https://supabase.com/dashboard/project/vhhvcxbmqpvcgxahsusd/editor
 */
(function () {
  'use strict';

  var SB_URL = 'https://vhhvcxbmqpvcgxahsusd.supabase.co';
  var SB_KEY = 'sb_publishable_Vc-FLF6TFi3AoEZVQyH72w_NCzl5X8F';
  var TABLE  = 'citabel_contacts';

  /* ── Client singleton ─────────────────────────────────── */
  function client() {
    if (window._citabelSB) return window._citabelSB;
    if (!window.supabase) { console.warn('[CITABEL] Supabase SDK non chargé'); return null; }
    window._citabelSB = window.supabase.createClient(SB_URL, SB_KEY);
    return window._citabelSB;
  }

  /* ── Lecture langue active ─────────────────────────────── */
  function getLang() {
    return localStorage.getItem('citabel.lang') || document.documentElement.lang || 'fr';
  }

  /* ── Formulaire de contact ─────────────────────────────── */
  function initContactForm() {
    var form = document.getElementById('quote-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      var lang      = getLang();
      var btn       = form.querySelector('button[type="submit"]');
      var successEl = form.querySelector('[data-success]');
      var sendingEl = form.querySelector('[data-sending]');

      /* État : envoi en cours */
      btn.disabled = true;
      btn.style.opacity = '0.55';
      if (sendingEl) sendingEl.style.display = 'inline';

      /* Lecture des champs */
      var activeTopic  = form.querySelector('#topics .is-on');
      var textInputs   = form.querySelectorAll('input[type="text"]');
      var selects      = form.querySelectorAll('select');
      var emailInput   = form.querySelector('input[type="email"]');
      var telInput     = form.querySelector('input[type="tel"]');
      var textarea     = form.querySelector('textarea');

      var payload = {
        topic:        activeTopic  ? activeTopic.dataset.v          : 'devis',
        full_name:    textInputs[0] ? textInputs[0].value.trim()    : '',
        organisation: textInputs[1] ? textInputs[1].value.trim() || null : null,
        email:        emailInput   ? emailInput.value.trim()         : '',
        phone:        telInput     ? telInput.value.trim() || null   : null,
        country:      selects[0]   ? selects[0].value               : 'Sénégal',
        volume:       selects[1]   ? selects[1].value || null        : null,
        message:      textarea     ? textarea.value.trim()           : '',
        lang:         lang,
        status:       'new'
      };

      /* Validation minimale */
      if (!payload.full_name || !payload.email || !payload.message) {
        btn.disabled = false;
        btn.style.opacity = '';
        if (sendingEl) sendingEl.style.display = 'none';
        return;
      }

      /* Envoi vers Supabase */
      try {
        var sb  = client();
        if (!sb) throw new Error('Client non initialisé');

        var res = await sb.from(TABLE).insert(payload);
        if (res.error) throw res.error;

        /* Succès */
        successEl.style.display = 'block';
        var spanEl = btn.querySelector('span');
        if (spanEl) spanEl.textContent = lang === 'en' ? 'Request sent ✓' : 'Demande envoyée ✓';
        form.querySelectorAll('input, textarea, select').forEach(function (el) { el.disabled = true; });

      } catch (err) {
        console.error('[CITABEL] Erreur soumission :', err);
        btn.disabled = false;
        btn.style.opacity = '';
        var msg = lang === 'en'
          ? 'An error occurred. Please try again or contact us by email.'
          : 'Une erreur est survenue. Réessayez ou contactez-nous par e-mail.';
        alert(msg);

      } finally {
        if (sendingEl) sendingEl.style.display = 'none';
      }
    });
  }

  /* ── Init ──────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }

})();
