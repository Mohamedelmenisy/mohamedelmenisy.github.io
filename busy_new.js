/*
  Unified script for InfiniBase Cases
  - Handles language toggling with smooth transitions.
  - Manages lightboxes for images and videos.
  - Loads all media on initialization.
*/

(function () {
    const APP_SELECTOR = '.kb-app';

    // ===== Lightbox Functions =====
    window.openLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) return;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
        const video = lb.querySelector('video');
        if (video && typeof video.play === 'function') {
            video.currentTime = 0;
            video.play().catch(() => {});
        }
    };

    window.closeLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) return;
        lb.classList.remove('active');
        document.body.style.overflow = '';
        const video = lb.querySelector('video');
        if (video && typeof video.pause === 'function') {
            video.pause();
        }
    };
    
    // ===== Eager Loading for Media =====
    function loadAllMedia() {
        const allMedia = document.querySelectorAll(`${APP_SELECTOR} img[data-src], ${APP_SELECTOR} video[data-src]`);
        allMedia.forEach(media => {
            if (media.src) return; // Already loaded
            const dataSrc = media.getAttribute('data-src');
            if (dataSrc) {
                media.src = dataSrc;
                media.removeAttribute('data-src');
                if (media.tagName === 'VIDEO') {
                    media.load();
                }
            }
        });
    }
    
    // ===== Language Toggle Function with Smooth Transition =====
    function toggleLanguage() {
      const button = document.getElementById("lang-toggle-button");
      const appWrapper = document.querySelector(APP_SELECTOR);
      if (!button || !appWrapper) return;

      appWrapper.classList.add('is-switching'); // Fade out

      setTimeout(() => {
        const isArabicActive = appWrapper.getAttribute('dir') === 'rtl';

        if (isArabicActive) {
          appWrapper.setAttribute('dir', 'ltr');
          button.textContent = "التحويل للعربية";
        } else {
          appWrapper.setAttribute('dir', 'rtl');
          button.textContent = "Switch to English";
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
        
        appWrapper.classList.remove('is-switching'); // Fade in
      }, 400); // Must match the transition duration in CSS
    }

    // ===== Initialization Function =====
    function init() {
        loadAllMedia();
    }

    // Run init on load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 0);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

    // ====== EVENT LISTENERS (Delegated for performance) ======
    document.addEventListener('click', function (e) {
        const target = e.target;
        
        // --- Language Toggle Button ---
        if (target.closest('#lang-toggle-button')) {
            toggleLanguage();
            return;
        }

        // --- Lightbox closing ---
        const overlay = target.closest('.lightbox-overlay');
        const closeBtn = target.closest('.lightbox-close');
        if(overlay || closeBtn) {
            const lb = target.closest('.css-lightbox');
            if (lb && lb.id) {
                closeLightbox(lb.id);
                e.preventDefault();
            }
            return;
        }

        // --- Smooth scroll for internal anchor links ---
        const anchor = target.closest('a[href^="#"]');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            try {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } catch (err) {
                console.error("Could not scroll to anchor:", err);
            }
            return;
        }
        
    }, true);
    
    // --- Close lightbox on ESC key ---
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
             const activeLightbox = document.querySelector('.css-lightbox.active');
             if(activeLightbox) closeLightbox(activeLightbox.id);
        }
    });

})();
