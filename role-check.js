/* 
 * role-check.js - unified role helper and UI helper functions
 * - getCurrentUserRole() returns 'admin'|'manager'|'agent' or null
 * - applyNavVisibility(role) updates header links and attaches protection for admin-only pages
 * - showProtectedModal() shows a warning when agent tries to open admin-only pages
 */

import { supabase } from './supabase.js';

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

        const role = profile?.role || 'agent';
        return role;

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
            el.setAttribute('aria-disabled', 'true');
        } else {
            el.classList.remove('protected-link');
            el.removeEventListener('click', protectedClickHandler);
            el.removeAttribute('aria-disabled');
        }
    });

    const roleBadge = document.getElementById('role-badge');
    if (roleBadge) roleBadge.textContent = role || 'guest';
}

function protectedClickHandler(e) {
    e.preventDefault();
    showProtectedModal();
}

// =======================================================
// 🌑 نسخة فخمة جدًا من المودال - شكل عصري ومغلق الصفحة
// =======================================================

export function showProtectedModal() {
    let modal = document.getElementById('protected-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'protected-modal';
        modal.className = 'protected-modal';
        modal.innerHTML = `
            <div class="protected-modal-overlay"></div>
            <div class="protected-modal-card">
                <div class="protected-modal-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3>Access Restricted</h3>
                <p>This area is for managers and administrators only.<br>
                If you believe you should have access, please contact your admin.</p>
                <button id="pm-close">Okay</button>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('pm-close').addEventListener('click', () => {
            modal.classList.remove('open');
            setTimeout(() => modal.remove(), 400);
        });
    }

    modal.classList.add('open');
}

// =======================================================
// 🎨 التصميم الحديث الفخم (CSS)
// =======================================================

const style = document.createElement('style');
style.textContent = `
.protected-modal {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
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
  background: radial-gradient(circle at center, rgba(10,10,10,0.92) 0%, rgba(0,0,0,0.95) 90%);
  backdrop-filter: blur(12px);
  animation: fadeIn 0.5s ease forwards;
}

.protected-modal-card {
  position: relative;
  z-index: 1;
  background: rgba(30, 35, 50, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 3rem 2.5rem;
  max-width: 440px;
  width: 90%;
  text-align: center;
  color: #fff;
  box-shadow: 0 0 50px rgba(0,0,0,0.6);
  transform: scale(0.9);
  animation: modalPop 0.35s ease forwards;
}

.protected-modal-icon {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  margin: 0 auto 1.8rem;
  background: radial-gradient(circle, rgba(96,165,250,0.15), rgba(96,165,250,0.05));
  border: 1px solid rgba(96,165,250,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 30px rgba(96,165,250,0.25);
  animation: pulse 2s infinite ease-in-out;
}

.protected-modal-card h3 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #ffffff, #a5b4fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.protected-modal-card p {
  color: #cbd5e1;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.8rem;
  opacity: 0.9;
}

#pm-close {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border: none;
  color: white;
  padding: 0.9rem 2.4rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 1rem;
  box-shadow: 0 0 25px rgba(78,140,255,0.25);
}

#pm-close:hover {
  transform: scale(1.05);
  box-shadow: 0 0 35px rgba(96,165,250,0.4);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(96,165,250,0.25); }
  50% { transform: scale(1.05); box-shadow: 0 0 50px rgba(96,165,250,0.4); }
}

@keyframes modalPop {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;
document.head.appendChild(style);
