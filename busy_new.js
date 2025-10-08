/* busy_new.js (Updated & Fixed)
- Fixes body scroll freezing issue.
- Ensures language toggle works correctly.
- Robust back-to-top scroll.
*/
(function () {
// ===== Lightbox Functions =====
window.openLightbox = function (targetId) {
    const lb = document.getElementById(targetId);
    if (!lb) return;
    lb.classList.add('active');
    // This is the line that can freeze the parent app's sidebar.
    document.body.style.overflow = 'hidden'; 
    const v = lb.querySelector('video');
    if (v && typeof v.play === 'function') v.play().catch(()=>{});
};

window.closeLightbox = function (targetId) {
    const lb = document.getElementById(targetId);
    if (!lb) return;
    lb.classList.remove('active');
    // CRUCIAL FIX: This line un-freezes the parent app's scroll.
    document.body.style.overflow = ''; 
    const v = lb.querySelector('video');
    if (v && typeof v.pause === 'function') v.pause();
};

// ===== Language Switch =====
function switchLanguage(lang) {
    const arContent = document.getElementById('ar-content');
    const enContent = document.getElementById('en-content');
    const langToggle = document.getElementById('lang-toggle-button');
    const appWrapper = document.querySelector('.kb-app');

    if (!arContent || !enContent || !langToggle || !appWrapper) return;

    if (lang === 'ar') {
        arContent.style.display = 'block';
        enContent.style.display = 'none';
        appWrapper.setAttribute('dir', 'rtl');
        langToggle.textContent = 'Switch to English';
        langToggle.setAttribute('data-lang', 'en');
    } else { // 'en'
        arContent.style.display = 'none';
        enContent.style.display = 'block';
        appWrapper.setAttribute('dir', 'ltr');
        langToggle.textContent = 'التحويل للعربية';
        langToggle.setAttribute('data-lang', 'ar');
    }
}

window.toggleLanguage = function () {
    const langToggle = document.getElementById('lang-toggle-button');
    if (!langToggle) return;
    const nextLang = langToggle.getAttribute('data-lang') || 'ar';
    switchLanguage(nextLang);
};

// ===== Smooth Scroll Top (FIXED to not interfere with routing) =====
window.scrollToTop = function () {
    // This function scrolls the main window without changing the URL hash.
    try { 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    } catch (e) { 
        // Fallback for older browsers
        window.scrollTo(0, 0); 
    }
};

// ===== Event Listeners =====
function attachDelegatedListeners() {
    // This function runs only once.
    if (document._busynew_delegated) return;

    document.addEventListener('click', function (e) {
        // Close lightbox on overlay or close button click
        const closeTrigger = e.target.closest('.lightbox-overlay, .lightbox-close');
        if (closeTrigger) {
            e.preventDefault();
            const lb = closeTrigger.closest('.css-lightbox');
            if (lb && lb.id) {
                closeLightbox(lb.id);
            }
        }
    }, true);

    document._busynew_delegated = true;
}

// ===== Initialization =====
function initBusyNew() {
    const langToggle = document.getElementById('lang-toggle-button');
    if (langToggle && !langToggle.dataset.eventAttached) {
        langToggle.addEventListener('click', function (e) {
            e.preventDefault();
            toggleLanguage();
        });
        langToggle.dataset.eventAttached = 'true';
    }

    // Set initial view to English
    if (document.getElementById('ar-content') && document.getElementById('en-content')) {
        switchLanguage('en');
    }

    attachDelegatedListeners();
}

// ===== Robust Loading Logic =====
// Run on load or immediately if DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initBusyNew, 0);
} else {
    document.addEventListener('DOMContentLoaded', initBusyNew, { once: true });
}

// Re-initialize if content is loaded dynamically (e.g., in SPAs)
try {
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const kbAppNode = document.querySelector('.kb-app');
                if (kbAppNode && !kbAppNode.dataset.initialized) {
                    initBusyNew();
                    kbAppNode.dataset.initialized = 'true';
                    // observer.disconnect(); // Optional: stop observing after init
                }
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
} catch (e) {
    console.warn("MutationObserver not supported or failed.", e);
}

// Expose init for manual calls if needed
window.initBusyNew = initBusyNew;

})();
