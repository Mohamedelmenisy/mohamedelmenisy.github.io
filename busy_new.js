/* busy_new.js - الكود المُعدَّل لضبط الوظائف والتنقل */

(function () {
    // ===== Lightbox Functions =====
    window.openLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) return;
        lb.classList.add('active');
        // FIX: The 'hidden' overflow should be on the main body to prevent background scrolling, 
        // but we'll try to rely on the lightbox's own scrolling first.
        // document.body.style.overflow = 'hidden'; 
        const v = lb.querySelector('video');
        if (v && typeof v.play === 'function') v.play().catch(()=>{});
    };

    window.closeLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) return;
        lb.classList.remove('active');
        // document.body.style.overflow = '';
        const v = lb.querySelector('video');
        if (v && typeof v.pause === 'function') v.pause();
    };

    // ===== Language switch Functions (Toggle) =====
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
        // Switch to the other language
        switchLanguage(currentLang);
    };

    // ===== Anchor Smooth Scroll (Crucial FIX for side-bar links) =====
    function smoothScroll(target) {
        if (!target) return;
        // Use document.querySelector(target) to find the element
        const targetElement = document.querySelector(target);
        if (targetElement) {
             // Scroll smoothly to the element's position
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start' // Scroll to the top of the element
            });
        }
    }

    // Attach delegated listeners to handle internal links and lightbox closing
    function attachDelegatedListeners() {
        // 1. Delegate for smooth scroll for internal links (Anchor links: #id)
        document.addEventListener('click', function (e) {
            let target = e.target;
            // Traverse up the DOM to find the nearest <a> tag
            while (target && target.tagName !== 'A' && target.parentElement) {
                target = target.parentElement;
            }
            
            // Check if it's a valid anchor link
            if (target && target.getAttribute('href') && target.getAttribute('href').startsWith('#')) {
                const targetId = target.getAttribute('href');
                if (targetId.length > 1) { // Not just '#'
                    // Prevent default jump action
                    e.preventDefault();
                    smoothScroll(targetId);
                }
            }
        });

        // 2. Delegate for closing lightbox by clicking overlay
        document.addEventListener('click', function (e) {
            if (e.target.classList.contains('lightbox-overlay')) {
                const lb = e.target.closest('.css-lightbox');
                if (lb) {
                    // Check if it's the overlay before closing
                    window.closeLightbox(lb.id);
                }
            }
        });
    }


    // Initialization logic: set event listeners and set initial language
    function initBusyNew() {
        const langToggle = document.getElementById('lang-toggle-button');
        if (langToggle && !langToggle._busynew_attached) {
            langToggle.addEventListener('click', function (e) {
                e.preventDefault();
                window.toggleLanguage();
            });
            langToggle._busynew_attached = true;
        }

        // Set initial view to English if both blocks exist (Default is English now)
        if (document.getElementById('ar-content') && document.getElementById('en-content')) {
            switchLanguage('en'); 
        }

        // Attach delegated listeners for smooth scroll, close overlay etc. only once
        if (!document._busynew_delegated) {
            attachDelegatedListeners();
            document._busynew_delegated = true;
        }
    }

    // Run initialization when content is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initBusyNew, 0);
    } else {
        document.addEventListener('DOMContentLoaded', initBusyNew);
    }

    // Use MutationObserver to catch if the content (.kb-app) is inserted dynamically later
    try {
        const mo = new MutationObserver(function (mutList) {
            for (const m of mutList) {
                for (const n of m.addedNodes) {
                    // Check if the added node or its children contain .kb-app
                    if (n && n.nodeType === 1 && (n.classList.contains('kb-app') || n.querySelector('.kb-app'))) {
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
