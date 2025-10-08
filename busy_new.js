/* busy_new.js
- Robust, works if content inserted after DOM load.
- Lazy loads images and videos for performance.
- Handles lightbox open/close via event delegation.
- Manages language switching (toggle).
- Includes a safe initialization that runs after content is ready.
- Smooth scrolling for anchor links.
- Visual guide toggle functionality.
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
        // Set initial view to English
        if (document.getElementById('ar-content') && document.getElementById('en-content')) {
            const arContent = document.getElementById('ar-content');
            const enContent = document.getElementById('en-content');
            enContent.style.display = "block";
            arContent.style.display = "none";
        }
        
        // Start lazy loading media
        lazyLoadMedia();
    }
    
    // Expose init function to be called from HTML
    window.initBusyNew = initBusyNew;

    // Fallback if script loads before DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initBusyNew, 0);
    } else {
        document.addEventListener('DOMContentLoaded', initBusyNew);
    }

    // ====== EVENT LISTENERS & DYNAMIC FUNCTIONS ======

    // (REQUEST 1) Language toggle function
    function toggleLanguage() {
      const button = document.getElementById("lang-toggle-button");
      const ar = document.getElementById("ar-content");
      const en = document.getElementById("en-content");
      const appWrapper = document.querySelector('.kb-app');
      
      if (!ar || !en || !button || !appWrapper) return;

      const isArabicVisible = ar.style.display === "block";

      if (isArabicVisible) {
        // Switch to English
        ar.style.display = "none";
        en.style.display = "block";
        button.textContent = "التحويل للعربية";
        button.setAttribute('data-lang','ar');
        appWrapper.setAttribute('dir', 'ltr');
      } else {
        // Switch to Arabic
        ar.style.display = "block";
        en.style.display = "none";
        button.textContent = "Switch to English";
        button.setAttribute('data-lang','en');
        appWrapper.setAttribute('dir', 'rtl');
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Delegated event listener for Lightbox closing and Anchor links
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

        // (REQUEST 3) Smooth scroll for internal anchor links
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;
        
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
    }, true);


    document.addEventListener('DOMContentLoaded', function(){
      // Attach listener to language button
      const langBtn = document.getElementById('lang-toggle-button');
      if (langBtn) langBtn.addEventListener('click', toggleLanguage);

      // (REQUEST 5) Attach listeners to visual guide toggle buttons
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
