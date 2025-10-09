/*
  Unified InfiniBase Cases JS - Final Optimized (v5)
  - Instant language toggle (no refresh required)
  - Fixed banner position regardless of language direction
  - Stable lightbox with proper centering & size
  - Instant image loading (no lazy-loading bugs)
  - Interactive Delay Calculator (fully functional)
  - Smooth performance (no freezing)
*/

(function () {
  const APP_SELECTOR = ".kb-app";

  // ====== Initialize on DOM ready ======
  document.addEventListener("DOMContentLoaded", () => {
    loadAllImagesImmediately();
    setupCalculator("en");
    setupCalculator("ar");
    setupLanguageToggle();
  });

  // ====== Fix Banner Position ======
  function fixBannerPosition() {
    const banner = document.querySelector(".header-banner");
    if (banner) {
      banner.style.position = "relative";
      banner.style.left = "0";
      banner.style.right = "auto";
      banner.style.margin = "0 auto";
      banner.style.textAlign = "left";
    }
  }

  // ====== Instant Load for Images ======
  function loadAllImagesImmediately() {
    document
      .querySelectorAll("img[data-src], video[data-src]")
      .forEach((el) => {
        const src = el.getAttribute("data-src");
        if (src) {
          el.src = src;
          el.removeAttribute("data-src");
        }
      });
  }

  // ====== Language Toggle ======
  function setupLanguageToggle() {
    const button = document.getElementById("lang-toggle-button");
    const app = document.querySelector(APP_SELECTOR);
    if (!button || !app) return;

    button.addEventListener("click", () => {
      const isArabic = app.getAttribute("dir") === "rtl";
      app.setAttribute("dir", isArabic ? "ltr" : "rtl");
      button.textContent = isArabic ? "التحويل للعربية" : "Switch to English";
      fixBannerPosition();
      alignArabicText();
    });
  }

  // ====== Arabic Alignment Fix ======
  function alignArabicText() {
    const app = document.querySelector(APP_SELECTOR);
    if (!app) return;
    if (app.getAttribute("dir") === "rtl") {
      app.querySelectorAll("p, li, h3, h4").forEach((el) => {
        el.style.textAlign = "right";
      });
    } else {
      app.querySelectorAll("p, li, h3, h4").forEach((el) => {
        el.style.textAlign = "left";
      });
    }
  }

  // ====== Lightbox Functions ======
  window.openLightbox = function (targetId) {
    const lb = document.getElementById(targetId);
    if (!lb) return;
    lb.classList.add("active");
    document.body.style.overflow = "hidden";
    lb.scrollIntoView({ behavior: "instant", block: "center" });
    const video = lb.querySelector("video");
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  };

  window.closeLightbox = function (targetId) {
    const lb = document.getElementById(targetId);
    if (!lb) return;
    lb.classList.remove("active");
    document.body.style.overflow = "";
    const video = lb.querySelector("video");
    if (video) video.pause();
  };

  document.addEventListener("click", (e) => {
    if (e.target.closest(".lightbox-overlay") || e.target.closest(".lightbox-close")) {
      const lb = e.target.closest(".css-lightbox");
      if (lb) closeLightbox(lb.id);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeLb = document.querySelector(".css-lightbox.active");
      if (activeLb) closeLightbox(activeLb.id);
    }
  });

  // ====== Calculator Setup ======
  function setupCalculator(lang) {
    const langSuffix = lang === "ar" ? "Ar" : "En";
    const estInput = document.getElementById(`estTimeInput${langSuffix}`);
    const actInput = document.getElementById(`actTimeInput${langSuffix}`);
    const orderTypeRadios = document.querySelectorAll(`input[name="orderType${langSuffix}"]`);
    const recommendationBox = document.getElementById(`recommendationBox${langSuffix}`);
    const recommendationTextElem = document.getElementById(`recommendationText${langSuffix}`);
    const copyBtn = document.getElementById(`copyBtn${langSuffix}`);

    if (!estInput || !actInput || !recommendationBox || !copyBtn) return;

    let currentText = "";

    const calculate = () => {
      const est = estInput.value;
      const act = actInput.value;
      if (!est || !act) return;

      const type = document.querySelector(`input[name="orderType${langSuffix}"]:checked`)?.value;
      const diff = Math.round((new Date(`1970-01-01T${act}:00`) - new Date(`1970-01-01T${est}:00`)) / 60000);

      let msg = "", boxClass = "info";

      if (diff < 0) {
        msg = lang === "en" ? "Error: Actual time before estimate." : "خطأ: الوقت الفعلي قبل الوقت المتوقع.";
        boxClass = "error";
      } else if (diff <= 15) {
        msg = lang === "en" ? `Delay: ${diff} mins — Apology only.` : `مدة التأخير ${diff} دقيقة — يكتفى بالاعتذار.`;
        boxClass = "info";
      } else {
        boxClass = "success";
        if (type === "fast") {
          if (diff <= 30) msg = lang === "en" ? "Delivery Fees only." : "رسوم التوصيل فقط.";
          else if (diff <= 45) msg = lang === "en" ? "Delivery + 25% chef." : "التوصيل + 25٪ من قيمة الطلب.";
          else if (diff <= 60) msg = lang === "en" ? "Delivery + 50% chef." : "التوصيل + 50٪ من قيمة الطلب.";
          else msg = lang === "en" ? "Full Order Amount." : "كامل قيمة الطلب.";
        } else {
          if (diff <= 60) msg = lang === "en" ? "50%-100% of order." : "من 50٪ إلى 100٪ من الطلب.";
          else msg = lang === "en" ? "Full + 50 SAR credit." : "كامل المبلغ + 50 ريال رصيد.";
        }
      }

      recommendationTextElem.innerHTML = msg;
      recommendationBox.className = `recommendation-box ${boxClass}`;
      currentText = msg;
    };

    [estInput, actInput, ...orderTypeRadios].forEach((el) => el.addEventListener("input", calculate));

    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(currentText).then(() => {
        const original = copyBtn.innerHTML;
        copyBtn.innerHTML = lang === "en" ? "Copied!" : "تم النسخ!";
        setTimeout(() => (copyBtn.innerHTML = original), 1500);
      });
    });
  }
})();
