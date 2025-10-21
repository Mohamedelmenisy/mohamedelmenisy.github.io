/* role-check.js - unified role helper and UI helper functions
   - getCurrentUserRole() returns 'admin'|'manager'|'agent' or null
   - applyNavVisibility(role) updates header links and attaches protection for admin-only pages
   - showProtectedModal() shows a warning when agent tries to open admin-only pages
*/
import { supabase } from './supabase.js';

// 🔊 صوت تنبيه عند محاولة دخول غير مصرح بها
const alertSound = new Audio('/elevo-core-flow/sounds/call_sound.mp3');
alertSound.volume = 0.5;

// فك الحظر من أول كليك
document.addEventListener('click', () => {
  alertSound.play().then(() => {
    alertSound.pause();
    alertSound.currentTime = 0;
  }).catch(() => {});
}, { once: true });

export async function getCurrentUserRole() {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return null;

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile', error);
      return null;
    }

    return profile?.role || 'agent';
  } catch (e) {
    console.error('getCurrentUserRole error', e);
    return null;
  }
}

export function applyNavVisibility(role) {
  document.querySelectorAll('[data-role-required]').forEach(el => {
    const req = el.getAttribute('data-role-required');
    if (!req) return;
    const allowed = req.split(',').map(s => s.trim());
    if (!role || !allowed.includes(role)) {
      el.classList.add('protected-link');
      el.addEventListener('click', protectedClickHandler);
      el.setAttribute('aria-disabled','true');
    } else {
      el.classList.remove('protected-link');
      el.removeEventListener('click', protectedClickHandler);
      el.removeAttribute('aria-disabled');
    }
  });

  const roleBadge = document.getElementById('role-badge');
  if (roleBadge) roleBadge.textContent = role || 'guest';
}

function protectedClickHandler(e){
  e.preventDefault();
  showProtectedModal();
}

export function showProtectedModal() {
  let modal = document.getElementById('protected-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'protected-modal';
    modal.className = 'protected-modal';
    modal.innerHTML = `
      <div class="protected-modal-overlay"></div>
      <div class="protected-modal-card">
        <div class="icon-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3>Access Restricted</h3>
        <p>This area is for managers and administrators only.<br>
        If you believe you should have access, please contact your admin.</p>
        <div class="protected-modal-actions">
          <button id="pm-close">Okay</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // زر الإغلاق
    document.getElementById('pm-close').addEventListener('click', ()=>{
      modal.classList.remove('open');
    });
  }

  modal.classList.add('open');
  alertSound.play().catch(()=>{});
}

/* 🌑 تصميم عصري للفورم */
const style = document.createElement('style');
style.textContent = `
.protected-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
.protected-modal.open {
  opacity: 1;
  pointer-events: all;
}
.protected-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.9);
  backdrop-filter: blur(10px);
}
.protected-modal-card {
  position: relative;
  background: rgba(25,28,40,0.9);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 420px;
  width: 90%;
  text-align: center;
  color: #fff;
  box-shadow: 0 0 40px rgba(0,0,0,0.6);
  z-index: 1;
  animation: modalPop 0.35s ease;
}
.protected-modal-card h3 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.protected-modal-card p {
  color: #cbd5e1;
  line-height: 1.6;
  margin-bottom: 1.8rem;
}
.protected-modal-actions button {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border: none;
  color: white;
  font-weight: 600;
  padding: 0.8rem 2.2rem;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.25s ease;
  box-shadow: 0 0 25px rgba(78,140,255,0.25);
}
.protected-modal-actions button:hover {
  transform: scale(1.05);
}
.icon-circle {
  width:80px;
  height:80px;
  margin:0 auto 1.5rem;
  border-radius:50%;
  background:rgba(96,165,250,0.15);
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid rgba(96,165,250,0.3);
  box-shadow:0 0 20px rgba(96,165,250,0.25);
}
@keyframes modalPop {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
`;
document.head.appendChild(style);
