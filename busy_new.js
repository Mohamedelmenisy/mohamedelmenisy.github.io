/*
  Unified script for InfiniBase Cases - Enhanced Version
  - Handles language toggling with persistence
  - Manages lightboxes for images and videos
  - Initializes copy-to-clipboard functionality
  - Loads media efficiently using Intersection Observer
  - Includes accessibility features like focus trapping
*/

(function () {
    'use strict';
    
    // ===================================
    // ===== Global Variables =====
    // ===================================

    const APP_SELECTOR = '.kb-app';
    let currentLightbox = null;

    // ===================================
    // ===== Lightbox Functions =====
    // ===================================

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
        
        // Accessibility: Trap focus inside the lightbox
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
    
    // ===================================
    // ===== Media Loading (Lazy Load) =====
    // ===================================

    function loadAllMedia() {
        const allMedia = document.querySelectorAll(`${APP_SELECTOR} img[data-src], ${APP_SELECTOR} video[data-src]`);
        
        if (!('IntersectionObserver' in window)) {
            allMedia.forEach(media => {
                if (media.src) return;
                const dataSrc = media.getAttribute('data-src');
                if (dataSrc) {
                    media.src = dataSrc;
                    media.removeAttribute('data-src');
                    if (media.tagName === 'VIDEO') media.load();
                }
            });
            return;
        }
        
        const mediaObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const media = entry.target;
                    const dataSrc = media.getAttribute('data-src');
                    if (dataSrc) {
                        media.src = dataSrc;
                        media.removeAttribute('data-src');
                        if (media.tagName === 'VIDEO') media.load();
                        observer.unobserve(media);
                    }
                }
            });
        }, { root: null, rootMargin: '50px 0px', threshold: 0.1 });
        
        allMedia.forEach(media => {
            if (media.src) return;
            mediaObserver.observe(media);
        });
    }
    
    // ===================================
    // ===== Language Toggle =====
    // ===================================

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
      } catch (e) { console.warn('Could not save language preference:', e); }
      
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // ===================================
    // ===== Restore Language Preference =====
    // ===================================

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
        } catch (e) { console.warn('Could not restore language preference:', e); }
    }
    
    // ===================================
    // ===== Media Experience Enhancements =====
    // ===================================

    function enhanceMediaExperience() {
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('loadstart', function() { this.style.opacity = '0.7'; });
            video.addEventListener('canplay', function() { this.style.opacity = '1'; });
            video.addEventListener('error', function() { console.error('Error loading video:', this.src); });
        });
    }

    // ===================================
    // ===== Initialization Function =====
    // ===================================

    function init() {
        restoreLanguagePreference();
        loadAllMedia();
        enhanceMediaExperience();
    }

    // ===================================
    // ====== EVENT LISTENERS ======
    // ===================================

    // Main click listener using event delegation
    document.addEventListener('click', function (e) {
        const target = e.target;
        
        // --- Language Toggle Button ---
        if (target.closest('#lang-toggle-button')) {
            toggleLanguage();
            return;
        }

        // --- Copy Button ---
        const copyBtn = target.closest('.copy-btn');
        if (copyBtn) {
            const textToCopy = copyBtn.closest('td').querySelector('span').textContent.trim();
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = copyBtn.textContent;
                const isRtl = copyBtn.closest('.kb-app[dir="rtl"]');
                copyBtn.textContent = isRtl ? 'تم النسخ!' : 'Copied!';
                copyBtn.classList.add('copied');
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                    copyBtn.classList.remove('copied');
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
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
                    if (targetElement.classList.contains('css-lightbox')) {
                        openLightbox(targetElement.id);
                    } else {
                        e.preventDefault();
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                } else {
                    const fallbackElement = document.getElementById(href.substring(1));
                    if (fallbackElement) {
                        e.preventDefault();
                        fallbackElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            } catch (err) { console.error("Could not scroll to anchor:", err); }
            return;
        }
    });
    
    // --- Close lightbox on ESC key ---
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && currentLightbox) {
            closeLightbox();
        }
    });

    // Run init on load
    document.addEventListener('DOMContentLoaded', init);

})();
