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

    // ===== Language Switch Function (MODIFIED) =====
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
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // This function is being replaced by the new logic in the event listener below.
    // window.toggleLanguage = function () {
    //     const langToggle = document.getElementById('lang-toggle-button');
    //     if (!langToggle) return;
    //     const nextLang = langToggle.getAttribute('data-lang') || 'en';
    //     switchLanguage(nextLang);
    // };
    
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
        // The original language toggle listener is replaced by the new one below.
        
        // Set initial view to English
        if (document.getElementById('ar-content') && document.getElementById('en-content')) {
            const arContent = document.getElementById('ar-content');
            const enContent = document.getElementById('en-content');
            enContent.style.display = "block";
            arContent.style.display = "none";
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
                
                // (OLD ANCHOR LOGIC REMOVED)
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

    // ====== NEW JS SNIPPETS ADDED/MODIFIED ======

    // أ) تفعيل زر التبديل بين اللغات (بدّل class وليس محتوى كامل)
    function toggleLanguage() {
      const button = document.getElementById("lang-toggle-button");
      const ar = document.getElementById("ar-content");
      const en = document.getElementById("en-content");
      const appWrapper = document.querySelector('.kb-app');
      
      if (!ar || !en || !button || !appWrapper) {
        // Fallback if containers don't exist
        document.body.classList.toggle('rtl-mode');
        const lang = document.body.classList.contains('rtl-mode') ? 'ar' : 'en';
        button.textContent = lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية';
        return;
      }

      const isArabicVisible = ar.style.display === "block";
      if (!isArabicVisible) {
        ar.style.display = "block";
        en.style.display = "none";
        button.textContent = "Switch to English";
        button.setAttribute('data-lang','en');
        appWrapper.setAttribute('dir', 'rtl');
      } else {
        ar.style.display = "none";
        en.style.display = "block";
        button.textContent = "التحويل للعربية";
        button.setAttribute('data-lang','ar');
        appWrapper.setAttribute('dir', 'ltr');
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.addEventListener('DOMContentLoaded', function(){
      const btn = document.getElementById('lang-toggle-button');
      if (btn) btn.addEventListener('click', toggleLanguage);

      const ar = document.getElementById("ar-content");
      const en = document.getElementById("en-content");
      if (en) en.style.display = "block";
      if (ar) ar.style.display = "none";
    });

    // ب) إصلاح سلوك روابط الـanchor الداخلية (تمنع التحويل للداشبورد)
    document.addEventListener('click', function(e){
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      if (!a.closest('.kb-app') && !a.closest('.kb-content')) return;
      
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      
      try {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            if (target.tagName.toLowerCase() === 'details' && !target.open) target.open = true;
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      } catch (err) {
          console.error("Could not scroll to anchor:", err);
      }
    }, true); // Use capture to handle event early

    // ج) زر show/hide للـ Visual Guides (الصور)
    document.addEventListener('DOMContentLoaded', function(){
      document.querySelectorAll('.toggle-visual').forEach(btn => {
        btn.addEventListener('click', function(){
          const guide = btn.nextElementSibling;
          if (!guide || !guide.classList.contains('visual-guide')) return;
          
          const isHidden = guide.style.display === 'none' || guide.style.display === '';
          guide.style.display = isHidden ? 'block' : 'none';
          
          if (isHidden) {
            guide.scrollIntoView({ behavior:'smooth', block: 'center' });
          }
        });
      });
    });

})();
