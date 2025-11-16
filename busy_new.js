/*
  Unified script for InfiniBase Cases - Enhanced Version
  - Handles language toggling with persistence
  - Manages lightboxes for images with improved performance
  - Loads media efficiently using Intersection Observer
  - Includes share button handling and card click delegation
*/

(function () {
    'use strict';
    
    const APP_SELECTOR = '.kb-app';
    let currentLightbox = null;

    // ===== Lightbox Functions =====
    window.openLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) return;
        
        currentLightbox = lb;
        lb.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const video = lb.querySelector('video');
        if (video && typeof video.play === 'function') {
            video.currentTime = 0;
            video.play().catch(() => {});
        }
        
        // إضافة focus trapping للوصول
        const focusableElements = lb.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    };

    window.closeLightbox = function (targetId) {
        const lb = targetId ? document.getElementById(targetId) : currentLightbox;
        if (!lb) return;
        
        lb.classList.remove('active');
        document.body.style.overflow = '';
        
        const video = lb.querySelector('video');
        if (video && typeof video.pause === 'function') {
            video.pause();
        }
        
        currentLightbox = null;
    };
    
    // ===== تحسين تحميل الوسائط =====
    function loadAllMedia() {
        const allMedia = document.querySelectorAll(`${APP_SELECTOR} img[data-src], ${APP_SELECTOR} video[data-src]`);
        
        if (!('IntersectionObserver' in window)) {
            allMedia.forEach(media => {
                if (media.src) return;
                const dataSrc = media.getAttribute('data-src');
                if (dataSrc) {
                    media.src = dataSrc;
                    media.removeAttribute('data-src');
                    if (media.tagName === 'VIDEO') {
                        media.load();
                    }
                }
            });
            return;
        }
        
        const observerOptions = {
            root: null,
            rootMargin: '50px 0px',
            threshold: 0.1
        };
        
        const mediaObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const media = entry.target;
                    const dataSrc = media.getAttribute('data-src');
                    
                    if (dataSrc) {
                        media.src = dataSrc;
                        media.removeAttribute('data-src');
                        if (media.tagName === 'VIDEO') {
                            media.load();
                        }
                        mediaObserver.unobserve(media);
                    }
                }
            });
        }, observerOptions);
        
        allMedia.forEach(media => {
            if (media.src) return;
            mediaObserver.observe(media);
        });
    }
    
    // ===== Language Toggle Function =====
    function toggleLanguage() {
      const button = document.getElementById("lang-toggle-button");
      const appWrapper = document.querySelector(APP_SELECTOR);
      if (!button || !appWrapper) return;

      const isArabicActive = appWrapper.getAttribute('dir') === 'rtl';

      if (isArabicActive) {
        appWrapper.setAttribute('dir', 'ltr');
        button.textContent = "التحويل للعربية";
        button.setAttribute('aria-label', 'Switch to Arabic');
      } else {
        appWrapper.setAttribute('dir', 'rtl');
        button.textContent = "Switch to English";
        button.setAttribute('aria-label', 'التحويل للغة الإنجليزية');
      }
      
      try {
        localStorage.setItem('preferred-language', isArabicActive ? 'en' : 'ar');
      } catch (e) {
        console.warn('Could not save language preference:', e);
      }
      
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // ===== استعادة تفضيل اللغة =====
    function restoreLanguagePreference() {
        try {
            const preferredLang = localStorage.getItem('preferred-language');
            const appWrapper = document.querySelector(APP_SELECTOR);
            const button = document.getElementById("lang-toggle-button");
            
            if (preferredLang && appWrapper && button) {
                if (preferredLang === 'ar' && appWrapper.getAttribute('dir') !== 'rtl') {
                    appWrapper.setAttribute('dir', 'rtl');
                    button.textContent = "Switch to English";
                    button.setAttribute('aria-label', 'التحويل للغة الإنجليزية');
                } else if (preferredLang === 'en' && appWrapper.getAttribute('dir') !== 'ltr') {
                    appWrapper.setAttribute('dir', 'ltr');
                    button.textContent = "التحويل للعربية";
                    button.setAttribute('aria-label', 'Switch to Arabic');
                }
            }
        } catch (e) {
            console.warn('Could not restore language preference:', e);
        }
    }

    // ===== تحسين تجربة الوسائط =====
    function enhanceMediaExperience() {
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('loadstart', function() {
                this.style.opacity = '0.7';
            });
            video.addEventListener('canplay', function() {
                this.style.opacity = '1';
            });
            video.addEventListener('error', function() {
                console.error('Error loading video:', this.src);
            });
        });
    }

    // ===== Share Button Utilities =====
    function openMailTo(subject, bodyHtml) {
        try {
            const mailto = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(bodyHtml);
            window.open(mailto, '_blank');
        } catch (err) {
            console.warn('Could not open mail client', err);
            window.location.href = mailto;
        }
    }
    function openWhatsApp(text) {
        const wa = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);
        window.open(wa, '_blank');
    }

    // Expose share utilities to the global scope
    window.infiniShare = {
        openMailTo,
        openWhatsApp
    };

    // ===== Initialization Function =====
    function init() {
        restoreLanguagePreference();
        loadAllMedia();
        enhanceMediaExperience();
    }

    // ====== EVENT LISTENERS ======

    // CAPTURE PHASE: Prevent card-level navigation when clicking on interactive controls
    // This listener runs first to stop propagation on specific share/action buttons.
    document.addEventListener('click', function(e){
        const btn = e.target.closest('.share-action-button, button.share-action-button, .no-propagation, .copy-action');
        if (btn) {
            e.stopPropagation();
        }
    }, true);

    // BUBBLE PHASE: Main event delegation for clicks
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

        // --- Smooth scroll for internal anchor links (or open lightboxes) ---
        const anchor = target.closest('a[href^="#"]');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            
            try {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    if (targetElement.classList.contains('css-lightbox')) {
                        openLightbox(targetElement.id);
                    } else {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } else {
                  console.warn('Element not found for anchor:', href);
                }
            } catch (err) {
                console.error("Could not scroll to anchor:", err);
            }
            return;
        }

        // --- Card click delegation ---
        // This runs only if no more specific interactive element was clicked above.
        const card = e.target.closest('.card[data-item-slug], .card[data-item-id]');
        if (card) {
            // Ignore if an interactive element inside the card was the actual target
            if (e.target.closest('button, a, input, textarea, select')) return;
            
            const slug = card.getAttribute('data-item-slug') || card.getAttribute('data-item-id');
            if (slug) {
                try {
                    window.location.hash = '#' + slug;
                } catch (err) {
                    console.warn('Could not navigate to card slug', err);
                }
            }
        }
    });

    // --- Close lightbox on ESC key ---
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && currentLightbox) {
            closeLightbox();
        }
    });

    // Run init on load
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 0);
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }

})();
