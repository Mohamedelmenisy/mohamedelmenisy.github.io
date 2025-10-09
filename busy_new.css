/* ==========================================================
   InfiniBase Cases - Final Optimized CSS (v5)
   - Fixed Arabic alignment
   - Static banner (doesn't move with language switch)
   - Balanced lightbox size & centered properly
   - Proper bullet alignment inside boxes
   - Optimized image scaling (no oversized visuals)
   ========================================================== */

/* ---------- Root Variables ---------- */
:root {
  --bg-main: #0b1220;
  --bg-content: #0f1724;
  --text-main: #e6eef8;
  --text-secondary: #9ca3af;
  --border-color: #1e293b;
  --color-highlight: #93c5fd;
  --color-pill: #6d28d9;
  --font-family: 'Cairo', sans-serif;
}

/* ---------- Base Layout ---------- */
.kb-app {
  font-family: var(--font-family);
  background: var(--bg-main);
  color: var(--text-main);
  margin: 0;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

/* ---------- Banner ---------- */
.header-banner {
  width: 100%;
  max-width: 650px;
  margin: 0 auto 1.5rem auto;
  text-align: left;
}
.kb-app[dir="rtl"] .header-banner {
  text-align: left !important; /* Keep static position */
}
.header-banner img {
  width: 100%;
  height: auto;
  border-radius: 10px;
  display: block;
}

/* ---------- Language Toggle Button ---------- */
#lang-toggle-button {
  display: inline-block;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 0.7rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  margin: 1rem auto;
  transition: 0.2s;
}
#lang-toggle-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
}

/* ---------- Text Alignment Fix ---------- */
.kb-app[dir="rtl"] p,
.kb-app[dir="rtl"] li,
.kb-app[dir="rtl"] h3,
.kb-app[dir="rtl"] h4 {
  text-align: right !important;
}
.kb-app[dir="ltr"] p,
.kb-app[dir="ltr"] li,
.kb-app[dir="ltr"] h3,
.kb-app[dir="ltr"] h4 {
  text-align: left !important;
}

/* ---------- Bullet Points ---------- */
.kb-app ul {
  list-style-position: inside !important;
  margin-left: 1rem;
  padding: 0;
}
.kb-app li {
  padding: 0.2rem 0.5rem;
}
.kb-app[dir="rtl"] li {
  padding-right: 0;
  padding-left: 10px;
}

/* ---------- Lightbox Styling ---------- */
.css-lightbox {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: none;
}
.css-lightbox.active {
  display: block;
}
.lightbox-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
}
.lightbox-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.4);
}
.lightbox-content img, .lightbox-content video {
  max-width: 100%;
  max-height: 70vh;
  height: auto;
  display: block;
  margin: 15px auto;
  border-radius: 8px;
}
.lightbox-close {
  position: absolute;
  top: 10px;
  font-size: 28px;
  cursor: pointer;
  color: var(--text-secondary);
  text-decoration: none;
}
.kb-app[dir="ltr"] .lightbox-close {
  right: 15px;
}
.kb-app[dir="rtl"] .lightbox-close {
  left: 15px;
}
.lightbox-close:hover {
  color: var(--color-highlight);
}

/* ---------- Image Size Control ---------- */
.media-preview img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: contain;
  max-height: 480px;
}
.image-grid-2 img {
  max-height: 350px;
}

/* ---------- Calculator ---------- */
.recommendation-box {
  margin-top: 1.5rem;
  padding: 1.25rem;
  border-radius: 8px;
  line-height: 1.6;
  border-left: 4px solid;
}
.recommendation-box.success {
  background-color: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
  color: #86efac;
}
.recommendation-box.info {
  background-color: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
  color: #93c5fd;
}
.recommendation-box.error {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #fca5a5;
}
.kb-app[dir="rtl"] .recommendation-box {
  border-left: 0;
  border-right: 4px solid;
}
.kb-app[dir="rtl"] .recommendation-box.success { border-right-color: #22c55e; }
.kb-app[dir="rtl"] .recommendation-box.info { border-right-color: #3b82f6; }
.kb-app[dir="rtl"] .recommendation-box.error { border-right-color: #ef4444; }

/* ---------- General Styling ---------- */
.kb-card {
  background: var(--bg-content);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem auto;
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
}
.kb-app h3 {
  color: var(--color-highlight);
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.75rem;
}
.kb-app a {
  color: var(--color-highlight);
  text-decoration: none;
}
.kb-app a:hover {
  text-decoration: underline;
  color: #a5b4fc;
}
