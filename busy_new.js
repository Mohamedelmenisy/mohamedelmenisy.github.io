/* busy_new.js
- Robust, works if content inserted after DOM load.
- Lazy loads images and videos for performance.
- Handles lightbox open/close via event delegation.
- Manages language switching (toggle).
- Includes a safe initialization that runs after content is ready.
- NEW: Smooth scrolling for internal anchor links and visual guide toggles.
*/

(function () {
    // ===== Lightbox Functions (Keep existing) =====
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
    
    // ===============================================
    // 4) تغييرات JavaScript (busy_new.js)
    // ===============================================

    // أ) تفعيل زر التبديل بين اللغات (بدّل class وليس محتوى كامل)
    // language toggle
    function toggleLanguage() {
      const button = document.getElementById("lang-toggle-button");
      const ar = document.getElementById("ar-content");
      const en = document.getElementById("en-content");
      // if ar/en container not exist, fallback: toggle dir class on body
      if (!ar || !en) {
        document.body.classList.toggle('rtl-mode');
        const lang = document.body.classList.contains('rtl-mode') ? 'ar' : 'en';
        button.textContent = lang === 'ar' ? 'التبديل إلى العربية' : 'Switch to English';
        return;
      }

      if (ar.style.display === "none" || ar.style.display === '') {
        ar.style.display = "block";
        en.style.display = "none";
        button.textContent = "التبديل إلى العربية";
        button.setAttribute('data-lang','ar');
      } else {
        ar.style.display = "none";
        en.style.display = "block";
        button.textContent = "Switch to English";
        button.setAttribute('data-lang','en');
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    
    // ===============================================
    // ب) إصلاح سلوك روابط الـanchor الداخلية
    // ===============================================
    // safe internal anchor scroll: only if anchor is inside kb-app/content
    document.addEventListener('click', function(e){
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      // only handle anchors inside our kb content
      if (!a.closest('.kb-app') && !a.closest('.kb-content')) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        // if target is a <details> closed, open it first
        if (target.tagName.toLowerCase() === 'details' && !target.open) target.open = true;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    // ===============================================
    // ج) زر show/hide للـ Visual Guides
    // ===============================================
    document.addEventListener('DOMContentLoaded', function(){
      document.querySelectorAll('.toggle-visual').forEach(btn => {
        btn.addEventListener('click', function(){
          const guide = btn.nextElementSibling;
          if (!guide) return;
          guide.style.display = (guide.style.display === 'none' || guide.style.display === '') ? 'block' : 'none';
          // smooth scroll to the guide when opening
          if (guide.style.display === 'block') guide.scrollIntoView({ behavior:'smooth', block: 'center' });
        });
      });
      
      // Event listener for language toggle and initial state setup (from 4-A)
      const btn = document.getElementById('lang-toggle-button');
      if (btn) btn.addEventListener('click', toggleLanguage);

      // ensure start in English if ar/content_ar missing
      const ar = document.getElementById("ar-content");
      const en = document.getElementById("en-content");
      if (en) en.style.display = "block";
      if (ar) ar.style.display = "none";
    });


    // ===== Initialization (Keep existing and adapt) =====
    function lazyLoad() {
        document.querySelectorAll('img[data-src], video[data-src]').forEach(el => {
            if (el.dataset.src) {
                el.src = el.dataset.src;
                el.removeAttribute('data-src');
            }
        });
    }

    function initBusyNew() {
        // Run lazy loading
        lazyLoad();
        
        // Existing Lightbox and keyboard handling logic
        if (!document._busynew_delegated) {
             document.addEventListener('click', function (e) {
                // Delegation for lightbox links (a[data-lightbox] or a[href^="#lb-"])
                const lbLink = e.target.closest('a[data-lightbox]');
                if (lbLink) {
                    window.openLightbox(lbLink.dataset.lightbox);
                    e.preventDefault();
                    return;
                }
                const lbHashLink = e.target.closest('a[href^="#lb-"]');
                if (lbHashLink) {
                    window.openLightbox(lbHashLink.getAttribute('href').substring(1));
                    e.preventDefault();
                    return;
                }
            }, true);
            
            // Existing keyboard/close delegation for lightboxes
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    const activeLb = document.querySelector('.css-lightbox.active');
                    if (activeLb) {
                        window.closeLightbox(activeLb.id);
                    }
                }
            });

            document._busynew_delegated = true;
        }
    }

    // Expose init function to be called from app.html
    window.initBusyNew = initBusyNew;

    // Fallback if script loads before DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initBusyNew, 0);
    } else {
        // Run init after DOM content is fully loaded
        document.addEventListener('DOMContentLoaded', initBusyNew);
    }

})();
