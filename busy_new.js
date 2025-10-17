/*
  Unified script for InfiniBase Cases - Enhanced Version
  - Handles language toggling with persistence
  - Manages lightboxes for images with improved performance
  - Loads media efficiently using Intersection Observer
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
        
        // إذا لم يدعم المتصفح Intersection Observer، نستخدم الطريقة التقليدية
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
      
      // حفظ التفضيل
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

    // ===== Initialization Function =====
    function init() {
        restoreLanguagePreference();
        loadAllMedia();
        
        // تحسين تجربة المستخدم للوسائط
        enhanceMediaExperience();
    }

    // ===== تحسين تجربة الوسائط =====
    function enhanceMediaExperience() {
        // إضافة عناصر تحميل للفيديوهات
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

    // ====== EVENT LISTENERS ======

    // Listener للـ clicks العادية (بدون passive)
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

        // --- Improved Smooth scroll for internal anchor links ---
        const anchor = target.closest('a[href^="#"]');
        if (anchor) {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            
            try {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    // إذا كان العنصر من نوع lightbox، نفتحه
                    if (targetElement.classList.contains('css-lightbox')) {
                        openLightbox(targetElement.id);
                    } else {
                        // إذا كان عنصر عادي، ننتقل إليه
                        e.preventDefault();
                        targetElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    }
                } else {
                    // إذا العنصر مش موجود، نحاول البحث عن أي عنصر بنفس الـ ID
                    const elementId = href.substring(1);
                    const fallbackElement = document.getElementById(elementId);
                    if (fallbackElement) {
                        e.preventDefault();
                        fallbackElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    } else {
                        console.warn('Element not found:', href);
                    }
                }
            } catch (err) {
                console.error("Could not scroll to anchor:", err);
            }
            return;
        }
    });

    // Listener منفصل للـ touch events (بـ passive) إذا احتجت
    document.addEventListener('touchstart', function (e) {
        // Touch events هنا ممكن تضيف أي handling لـ
        // لكن مش هنحتاج preventDefault هنا
    }, { passive: true });
    
    // --- Close lightbox on ESC key ---
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
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
