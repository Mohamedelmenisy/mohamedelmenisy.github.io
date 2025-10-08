/* busy_new.js
- Robust, works if content inserted after DOM load.
- Lazy loads images and videos for performance.
- Handles lightbox open/close via event delegation.
- Manages language switching (toggle).
- Includes a safe initialization that runs after content is ready.
- NEW: Smooth scrolling for anchor links.
*/

(function () {
    // ===== Lightbox Functions =====
    window.openLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) return;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
        const video = lb.querySelector('video');
        if (video && typeof video.play === 'function') {
            video.play().catch(() => {}); // Autoplay video in lightbox
        }
    };

    window.closeLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) return;
        lb.classList.remove('active');
        document.body.style.overflow = '';
        const video = lb.querySelector('video');
        if (video && typeof video.pause === 'function') {
            video.pause(); // Pause video when closing
        }
    };

    // ===== Language Switch Function =====
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
        } else {
            arContent.style.display = 'none';
            enContent.style.display = 'block';
            appWrapper.setAttribute('dir', 'ltr');
            langToggle.textContent = 'التحويل للعربية';
            langToggle.setAttribute('data-lang', 'ar');
        }
        // MODIFICATION: Scroll to top on language change
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    window.toggleLanguage = function () {
        const langToggle = document.getElementById('lang-toggle-button');
        if (!langToggle) return;
        const nextLang = langToggle.getAttribute('data-lang') || 'en';
        switchLanguage(nextLang);
    };
    
    // ===== Lazy Loading for Media =====
    function lazyLoadMedia() {
        const lazyMedia = document.querySelectorAll('.kb-app img[data-src], .kb-app video[data-src]');
        if ('IntersectionObserver' in window) {
            const mediaObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const media = entry.target;
                        const src = media.getAttribute('data-src');
                        media.src = src;
                        media.removeAttribute('data-src');
                        if (media.tagName === 'VIDEO') {
                           media.load();
                        }
                        observer.unobserve(media);
                    }
                });
            });
            lazyMedia.forEach(media => mediaObserver.observe(media));
        } else {
            // Fallback for older browsers
            lazyMedia.forEach(media => {
                media.src = media.getAttribute('data-src');
                media.removeAttribute('data-src');
            });
        }
    }

    // ===== Initialization Function =====
    function initBusyNew() {
        // Attach click listener to language toggle button
        const langToggle = document.getElementById('lang-toggle-button');
        if (langToggle && !langToggle._busynew_attached) {
            langToggle.addEventListener('click', (e) => {
                e.preventDefault();
                window.toggleLanguage();
            });
            langToggle._busynew_attached = true;
        }

        // Set initial view to English
        if (document.getElementById('ar-content') && document.getElementById('en-content')) {
            // Check if a language is already displayed, if not, set default
            const arStyle = window.getComputedStyle(document.getElementById('ar-content'));
            const enStyle = window.getComputedStyle(document.getElementById('en-content'));
            if (arStyle.display === 'none' && enStyle.display === 'none') {
                 switchLanguage('en');
            }
        }
        
        // Start lazy loading media
        lazyLoadMedia();
        
        // Attach delegated listeners for lightbox closing and anchor links
        if (!document._busynew_delegated) {
            document.addEventListener('click', function (e) {
                // Lightbox close logic
                const overlay = e.target.closest('.lightbox-overlay');
                if (overlay) {
                    const lb = overlay.closest('.css-lightbox');
                    if (lb && lb.id) {
                        closeLightbox(lb.id);
                        e.preventDefault();
                    }
                }
                const closeBtn = e.target.closest('.lightbox-close');
                 if (closeBtn) {
                    const lb = closeBtn.closest('.css-lightbox');
                    if (lb && lb.id) {
                        closeLightbox(lb.id);
                        e.preventDefault();
                    }
                }
                
                // FIX: Anchor link smooth scroll logic
                const anchorLink = e.target.closest('a[href^="#"]');
                if (anchorLink) {
                    const href = anchorLink.getAttribute('href');
                    // Ensure it's not just a placeholder hash that does nothing
                    if (href.length > 1) {
                        try {
                            const targetElement = document.getElementById(href.substring(1));
                            if (targetElement) {
                                e.preventDefault();
                                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        } catch (err) {
                            console.error("Could not scroll to anchor:", err);
                        }
                    }
                }
            }, true);
            document._busynew_delegated = true;
        }
    }

    // Expose init function to be called from app.html
    window.initBusyNew = initBusyNew;

    // Fallback if script loads before DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initBusyNew, 0);
    } else {
        document.addEventListener('DOMContentLoaded', initBusyNew);
    }
})();
