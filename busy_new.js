/* busy_new.js
- Robust, works if content inserted after DOM load.
- Lazy loads images and videos for performance.
- Handles lightbox open/close via event delegation.
- Manages language switching (toggle) using DIR attribute.
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
        
        // Find media element and play/load
        const media = lb.querySelector('video[data-src], img[data-src]');
        if (media && media.tagName === 'VIDEO') {
            const src = media.getAttribute('data-src');
            if (src) {
                media.src = src; // Load source if not loaded
                media.removeAttribute('data-src');
                if (typeof media.play === 'function') {
                    media.play().catch(() => {}); // Autoplay video in lightbox
                }
            }
        } else if (media && media.tagName === 'IMG') {
             const src = media.getAttribute('data-src');
            if (src) {
                media.src = src; // Load source if not loaded
                media.removeAttribute('data-src');
            }
        }

    };

    window.closeLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (!lb) return;
        lb.classList.remove('active');
        document.body.style.overflow = '';
        
        // Pause video when closing
        const video = lb.querySelector('video');
        if (video && typeof video.pause === 'function') {
            video.pause(); 
            // Optional: reset video time to beginning
            video.currentTime = 0;
        }
    };
    
    // ===== Lazy Loading for Media =====
    function lazyLoadMedia() {
        // Only load media that is NOT inside a .css-lightbox container to keep lightbox performance high
        const lazyMedia = document.querySelectorAll('.kb-app:not(.css-lightbox) img[data-src], .kb-app:not(.css-lightbox) video[data-src]');
        
        lazyMedia.forEach(media => {
            if (media.offsetParent !== null) { // Only load if element is likely visible
                const src = media.getAttribute('data-src');
                if (src) {
                    if (media.tagName === 'IMG') {
                        media.src = src;
                    } else if (media.tagName === 'VIDEO') {
                        media.src = src;
                        // For videos outside lightboxes, preload poster and metadata
                        media.load();
                    }
                    media.removeAttribute('data-src');
                }
            }
        });
    }

    // ===== (تعديل 6) Language Toggle Function Fix =====
    function toggleLanguage() {
        const kbApp = document.querySelector('.kb-app');
        const toggleBtn = document.getElementById('lang-toggle-button');
        if (!kbApp || !toggleBtn) return;

        const currentDir = kbApp.getAttribute('dir');

        if (currentDir === 'ltr') {
            // Switch to Arabic (RTL)
            kbApp.setAttribute('dir', 'rtl');
            toggleBtn.textContent = 'Switch to English';
        } else {
            // Switch to English (LTR)
            kbApp.setAttribute('dir', 'ltr');
            toggleBtn.textContent = 'التحويل للعربية';
        }
        // The display logic is now handled by CSS based on [dir="rtl"] or [dir="ltr"]
        // Re-lazy load media just in case newly visible content needs loading
        lazyLoadMedia();
    }

    // ===== Safe Initialization & Listeners =====
    function initialize() {
        // Run lazy load immediately for content visible on page load
        lazyLoadMedia();
    }

    // Listeners and Initialization
    document.addEventListener('click', function(e) {
        // Smooth scroll for internal anchor links
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

      // (تعديل 3) Attach listeners to visual guide toggle buttons
      document.querySelectorAll('.toggle-visual').forEach(btn => {
        btn.addEventListener('click', function(){
          // The visual guide is the immediate next sibling
          const guide = btn.nextElementSibling;
          if (!guide || !guide.classList.contains('visual-guide')) return;
          
          const isHidden = guide.style.display === 'none' || guide.style.display === '';
          
          // Toggle display
          guide.style.display = isHidden ? 'block' : 'none';
          
          if (isHidden) {
            // Smooth scroll to the revealed content
            guide.scrollIntoView({ behavior:'smooth', block: 'center' });
            // Load media inside the revealed section
            lazyLoadMedia(); 
          }
        });
      });
      
      // Run the main initialization function after DOM is ready
      initialize();
    });

    // Run initialization even if DOMContentLoaded already fired (when content is injected later)
    if (document.readyState === 'complete') {
        initialize();
    }

})();
