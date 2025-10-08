(function () {
    // ===== Lightbox Functions =====
    const mediaLightbox = document.getElementById('media-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    
    // For dedicated lightboxes like Slot Details
    window.openLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (lb) {
            lb.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    // For the central media lightbox
    window.openMediaLightbox = function (type, src) {
        if (!mediaLightbox) return;
        
        if (type === 'image') {
            lightboxImg.src = src;
            lightboxImg.style.display = 'block';
            lightboxVideo.style.display = 'none';
        } else if (type === 'video') {
            lightboxVideo.src = src;
            lightboxVideo.style.display = 'block';
            lightboxImg.style.display = 'none';
            lightboxVideo.play();
        }
        mediaLightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeLightbox = function (targetId) {
        const lb = document.getElementById(targetId);
        if (lb) {
            lb.classList.remove('active');
            document.body.style.overflow = '';
            const video = lb.querySelector('video');
            if (video) video.pause();
        }
    };

    // ===== Language Switch =====
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
    }

    // ===== Smooth Scroll & Back to Top Button =====
    const backToTopBtn = document.getElementById('back-to-top');
    window.scrollToTop = function () {
        try { 
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        } catch (e) { 
            window.scrollTo(0, 0); 
        }
    };

    function handleScroll() {
        if (backToTopBtn) {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }
    }

    // ===== Initialization =====
    function init() {
        // Language Toggle
        const langToggle = document.getElementById('lang-toggle-button');
        if (langToggle && !langToggle.dataset.attached) {
            langToggle.addEventListener('click', () => {
                const nextLang = langToggle.getAttribute('data-lang') || 'ar';
                switchLanguage(nextLang);
            });
            langToggle.dataset.attached = 'true';
        }
        
        switchLanguage('en'); // Default to English
        
        // Back to Top scroll listener
        window.addEventListener('scroll', handleScroll);
    }
    
    // Run script
    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
