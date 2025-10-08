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
    const v = lb.querySelector('video');
    // منع التشغيل التلقائي عبر JS (مع الأمل أن يكون preload="metadata" في HTML كافي)
    // if (v && typeof v.play === 'function') v.play().catch(()=>{});
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
        langToggle.setAttribute('data-lang', 'en');
        langToggle.textContent = 'Switch to English';
        appWrapper.setAttribute('dir', 'rtl');
    } else { // 'en'
        arContent.style.display = 'none';
        enContent.style.display = 'block';
        langToggle.setAttribute('data-lang', 'ar');
        langToggle.textContent = 'التحويل للعربية';
        appWrapper.setAttribute('dir', 'ltr');
    }
}

window.toggleLanguage = function () {
    const langToggle = document.getElementById('lang-toggle-button');
    const currentLang = langToggle.getAttribute('data-lang') === 'ar' ? 'en' : 'ar';
    switchLanguage(currentLang);
    // scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
};

// ===== Anchor Fix: Open Details before scrolling =====
function handleAnchorClick(e) {
    // Check if the click target is an anchor tag with a hash
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor || anchor.href.indexOf('#') === -1) return;

    const hash = anchor.getAttribute('href');
    if (hash.length <= 1) return; // Skip "#" anchor

    const targetId = hash.substring(1);
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    // 1. Find the closest <details> parent to the target element
    let parentDetails = targetElement.closest('details');

    // 2. Open all parent <details> elements before scrolling
    let detailsToOpen = [];
    let current = targetElement;
    while(current && current !== document.body) {
        if(current.tagName === 'DETAILS' && !current.open) {
            detailsToOpen.push(current);
        }
        current = current.parentElement;
    }

    if (detailsToOpen.length > 0) {
        e.preventDefault(); // Stop default scroll

        // Open details from outside-in (bottom of the array to top)
        for (let i = detailsToOpen.length - 1; i >= 0; i--) {
            detailsToOpen[i].open = true;
        }

        // 3. Scroll smoothly to the target element after opening
        setTimeout(() => {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100); // Small delay to allow layout change
    }
    // If no parent details, let default behavior happen, or if details is already open.
}

// ===== Delegated Listeners =====
function attachDelegatedListeners() {
    document.addEventListener('click', function (e) {
        // Close lightbox by clicking overlay or close button
        if (e.target.classList.contains('lightbox-overlay') || e.target.classList.contains('lightbox-close')) {
            const lb = e.target.closest('.css-lightbox');
            if (lb) {
                e.preventDefault();
                window.closeLightbox(lb.id);
            }
        }
        
        // Handle Anchor Links fix
        handleAnchorClick(e);
        
        // Handle Back-to-Top (for anchors that use javascript:void(0))
        if(e.target.closest('.back-to-top a') && e.target.closest('.back-to-top a').href.includes('javascript')) {
             e.preventDefault();
             window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// ===== Initialization Logic =====
function initBusyNew() {
    // Attach language toggle listener
    const langToggle = document.getElementById('lang-toggle-button');
    if (langToggle && !langToggle._busynew_attached) {
        langToggle.addEventListener('click', function (e) {
            e.preventDefault();
            window.toggleLanguage();
        });
        langToggle._busynew_attached = true;
    }

    // Set initial view to English if both blocks exist and language is not set (default to en)
    if (document.getElementById('ar-content') && document.getElementById('en-content')) {
        // Check current dir to decide initial language, default to 'en' (ltr)
        const appWrapper = document.querySelector('.kb-app');
        if (appWrapper && appWrapper.getAttribute('dir') === 'rtl') {
             switchLanguage('ar'); // Initialize to Arabic if dir="rtl" is set in HTML
        } else {
             switchLanguage('en'); // Default to English
        }
    }

    // Attach delegated listeners for close overlay, anchor fix etc.
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

// Re-initialize if content is loaded dynamically via MutationObserver
try {
    const mo = new MutationObserver(function (mutList) {
        for (const m of mutList) {
            for (const n of m.addedNodes) {
                if (n && n.querySelector && (n.classList && n.classList.contains('kb-app') || n.querySelector('.kb-app'))) {
                    initBusyNew();
                    return; // Init once and exit
                }
            }
        }
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
} catch (e) { /* Mutation Observer not supported */ }
})();
