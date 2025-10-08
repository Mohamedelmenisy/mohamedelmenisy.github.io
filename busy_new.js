/* busy_new.js - v2
Robust, works if content inserted after DOM load.

* lightbox open/close
* language switch (toggle) with smooth scroll
* back-to-top smooth scroll
* smart internal link handling (opens <details>)
* initialization that is safe whether script runs before/after content insertion
*/

(function () {

// ===== Lightbox =====
window.openLightbox = function (targetId) {
    const lb = document.getElementById(targetId);
    if (!lb) return;
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
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
    // Scroll to top after switching
    window.scrollToTop();
}

window.toggleLanguage = function () {
    const langToggle = document.getElementById('lang-toggle-button');
    if (!langToggle) return;
    const nextLang = langToggle.getAttribute('data-lang') || 'ar';
    switchLanguage(nextLang);
};

// ===== Smooth scroll top =====
window.scrollToTop = function () {
    try { 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    } catch (e) { 
        window.scrollTo(0, 0); 
    }
};

// ===== Attach event listeners =====
function attachDelegatedListeners() {
    document.addEventListener('click', function (e) {
        // Close lightbox on overlay or close button click
        const closeTrigger = e.target.closest('.lightbox-overlay, .lightbox-close');
        if (closeTrigger) {
            const lb = e.target.closest('.css-lightbox');
            if (lb && lb.id) {
                closeLightbox(lb.id);
                e.preventDefault();
            }
        }
        
        // Smart scroll for internal links
        const internalLink = e.target.closest('a.internal-link');
        if (internalLink && internalLink.hash) {
            const targetElement = document.querySelector(internalLink.hash);
            if (targetElement) {
                e.preventDefault();
                
                // Check if target is inside a closed <details> tag and open it
                const parentDetails = targetElement.closest('details');
                if (parentDetails && !parentDetails.open) {
                    parentDetails.open = true;
                }
                
                // Scroll to the element
                setTimeout(() => {
                   targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100); // Small delay to allow <details> to open
            }
        }
    }, true);
}

// ===== Initialization =====
function initBusyNew() {
    const langToggle = document.getElementById('lang-toggle-button');
    if (langToggle && !langToggle._busynew_attached) {
        langToggle.addEventListener('click', function (e) {
            e.preventDefault();
            window.toggleLanguage();
        });
        langToggle._busynew_attached = true;
    }

    // Set initial view to English if both blocks exist
    if (document.getElementById('ar-content') && document.getElementById('en-content')) {
        switchLanguage('en');
    }

    // Attach delegated listeners for close overlay etc. if not already attached
    if (!document._busynew_delegated) {
        attachDelegatedListeners();
        document._busynew_delegated = true;
    }
}

// Run on load or immediately if DOM is ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initBusyNew, 0);
} else {
    document.addEventListener('DOMContentLoaded', initBusyNew);
}

// Re-initialize if content is loaded dynamically (e.g., via AJAX/Mutation)
try {
    const mo = new MutationObserver(function (mutList) {
        for (const m of mutList) {
            if (m.addedNodes.length > 0) {
                 initBusyNew();
                 // We don't disconnect, to handle multiple dynamic loads
            }
        }
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
} catch (e) { /* Fails gracefully on older browsers */ }

// Expose init in case of manual call
window.initBusyNew = initBusyNew;

})();
