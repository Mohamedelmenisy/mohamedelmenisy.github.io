/* busy_new.js - الكود المُعدَّل لضبط اللغة والوظائف */
/*
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
        // if there's a video inside ensure it plays
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

        if (lang === 'en') {
            enContent.style.display = 'block';
            arContent.style.display = 'none';
            appWrapper.setAttribute('dir', 'ltr');
            langToggle.textContent = 'التبديل إلى العربية';
            langToggle.setAttribute('data-lang', 'ar');
        } else {
            arContent.style.display = 'block';
            enContent.style.display = 'none';
            appWrapper.setAttribute('dir', 'rtl');
            langToggle.textContent = 'Switch to English';
            langToggle.setAttribute('data-lang', 'en');
        }
    }

    window.toggleLanguage = function () {
        const langToggle = document.getElementById('lang-toggle-button');
        if (!langToggle) return;
        const currentLang = langToggle.getAttribute('data-lang');
        switchLanguage(currentLang);
    };

    // ===== Back to Top (Smooth Scroll) =====
    function smoothScroll(target) {
        if (!target) return;
        document.querySelector(target).scrollIntoView({
            behavior: 'smooth'
        });
    }

    function attachDelegatedListeners() {
        // Delegate for smooth scroll for internal links
        document.addEventListener('click', function (e) {
            let target = e.target;
            while (target && target.tagName !== 'A') {
                target = target.parentElement;
            }
            if (target && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
                const targetId = target.getAttribute('href');
                if (targetId.length > 1) { // Check if it's not just '#'
                    e.preventDefault();
                    smoothScroll(targetId);
                }
            }
        });

        // Delegate for closing lightbox by clicking overlay
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('lightbox-overlay')) {
                const lb = e.target.closest('.css-lightbox');
                if (lb) {
                    window.closeLightbox(lb.id);
                }
            }
        });
    }


    // Initialization logic: set event listeners, click on lang toggle and set initial lang to Arabic
    function initBusyNew() {
        const langToggle = document.getElementById('lang-toggle-button');
        if (langToggle && !langToggle._busynew_attached) {
            langToggle.addEventListener('click', function (e) {
                e.preventDefault();
                window.toggleLanguage();
            });
            langToggle._busynew_attached = true;
        }

        // set initial view to English if both blocks exist (Default is English now)
        if (document.getElementById('ar-content') && document.getElementById('en-content')) {
            switchLanguage('en'); // CHANGED: Default is English
        }

        // attach delegated listeners for smooth scroll, close overlay etc.
        if (!document._busynew_delegated) {
            attachDelegatedListeners();
            document._busynew_delegated = true;
        }

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
                    }
                }
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
        console.error('MutationObserver failed', e);
    }

})();
