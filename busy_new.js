/* busy_new.js
Robust, works if content inserted after DOM load.

* lightbox open/close
* language switch (toggle)
* back-to-top smooth scroll
* initialization that is safe whether script runs before/after content insertion
  */

(function () {
// ===== Lightbox =====
window.openLightbox = function (targetId) {
const lb = document.getElementById(targetId);
if (!lb) return;
lb.classList.add('active');
document.body.style.overflow = 'hidden';
// if there's a video inside ensure it plays (optional)
const v = lb.querySelector('video');
if (v && typeof v.play === 'function') v.play().catch(()=>{});
};

window.closeLightbox = function (targetId) {
const lb = document.getElementById(targetId);
if (!lb) return;
lb.classList.remove('active');
document.body.style.overflow = '';
const v = lb.querySelector('video');
if (v && typeof v.pause === 'function') v.pause();
};

// ===== Language switch =====
function switchLanguage(lang) {
const arContent = document.getElementById('ar-content');
const enContent = document.getElementById('en-content');
const langToggle = document.getElementById('lang-toggle-button');
const appWrapper = document.querySelector('.kb-app');

```
if (!arContent || !enContent || !langToggle || !appWrapper) return;

if (lang === 'ar') {
  arContent.style.display = 'block';
  enContent.style.display = 'none';
  appWrapper.setAttribute('dir', 'rtl');
  langToggle.textContent = 'Switch to English';
  langToggle.setAttribute('data-lang', 'en');
} else {
  arContent.style.display = 'none';
  enContent.style.display = 'block';
  appWrapper.setAttribute('dir', 'ltr');
  langToggle.textContent = 'التحويل للعربية';
  langToggle.setAttribute('data-lang', 'ar');
}
```

}

// toggle based on data-lang OR current visibility
window.toggleLanguage = function () {
const langToggle = document.getElementById('lang-toggle-button');
if (!langToggle) return;
const next = langToggle.getAttribute('data-lang') || (document.getElementById('ar-content').style.display === 'none' ? 'ar' : 'en');
switchLanguage(next);
};

// smooth scroll top
window.scrollToTop = function () {
try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }
};

// attach delegated listeners for lightbox close (overlay and close buttons)
function attachDelegatedListeners() {
document.addEventListener('click', function (e) {
// Close when clicking .lightbox-overlay or .lightbox-close
const overlay = e.target.closest('.lightbox-overlay');
if (overlay) {
const lb = overlay.closest('.css-lightbox');
if (lb && lb.id) closeLightbox(lb.id);
e.preventDefault();
return;
}
const close = e.target.closest('.lightbox-close');
if (close) {
const lb = close.closest('.css-lightbox');
if (lb && lb.id) closeLightbox(lb.id);
e.preventDefault();
return;
}
// open lightbox: elements may call openLightbox('id') inline. We also handle clickable media-preview anchors
const media = e.target.closest('.media-preview a, .media-preview');
if (media) {
// allow inline onclick handlers to run; if they don't, try to find href / data-target
const anchor = media.closest('a');
if (anchor) {
// if anchor has onclick openLightbox("id") it'll already run; otherwise if anchor.href="#lb-xxx" pattern:
const href = anchor.getAttribute('href') || '';
if (href.startsWith('#lb-')) {
const id = href.replace('#', '');
openLightbox(id);
e.preventDefault();
}
}
}
}, true);
}

// init: attach click on lang toggle and set initial lang to Arabic
function initBusyNew() {
const langToggle = document.getElementById('lang-toggle-button');
if (langToggle && !langToggle._busynew_attached) {
langToggle.addEventListener('click', function (e) {
e.preventDefault();
window.toggleLanguage();
});
langToggle._busynew_attached = true;
}

```
// set initial view to Arabic if both blocks exist
if (document.getElementById('ar-content') && document.getElementById('en-content')) {
  switchLanguage('ar');
}

// attach delegated listeners for close overlay etc.
if (!document._busynew_delegated) {
  attachDelegatedListeners();
  document._busynew_delegated = true;
}
```

}

// Run on load (if content already in DOM)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
setTimeout(initBusyNew, 0);
} else {
document.addEventListener('DOMContentLoaded', initBusyNew);
}

// MutationObserver: if .kb-app inserted later, init again
try {
const mo = new MutationObserver(function (mutList) {
for (const m of mutList) {
for (const n of m.addedNodes) {
if (n && n.querySelector && (n.classList && n.classList.contains && n.classList.contains('kb-app') || n.querySelector('.kb-app'))) {
initBusyNew();
return;
}
}
}
});
mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
} catch (e) { /* noop */ }

// expose init in case you need to call manually:
window.initBusyNew = initBusyNew;
})();
