/* Shared design tokens and improvements */
:root{
  --brand-500: #0b5fff; /* primary */
  --brand-600: #084fd6;
  --muted-600: #6b7280;
  --bg: #0f1724;
  --card-bg: #0b1220;
  --glass: rgba(255,255,255,0.04);
  --success: #16a34a;
  --danger: #ef4444;
  --radius: 10px;
  --gap: 12px;
  --max-width: 1200px;
  --mono: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue';
}

/* Reset small things */
body { font-family: var(--mono); margin:0; background: linear-gradient(180deg,#071428 0%, #071727 100%); color: #e6eef8; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;}
.container{ max-width: var(--max-width); margin: 0 auto; padding: 20px; }

/* Sticky header */
.app-header{
  position: sticky; top:0; z-index:40; background: rgba(6,11,22,0.7); backdrop-filter: blur(6px); border-bottom: 1px solid rgba(255,255,255,0.04);
  display:flex; align-items:center; justify-content:space-between; padding: 10px 18px;
}
.app-header .brand { display:flex; align-items:center; gap:10px; font-weight:700; font-size:18px; color:var(--brand-500); }
.app-header nav{ display:flex; gap:10px; align-items:center; }
.app-header a{ color: #dbeafe; text-decoration:none; padding:8px 12px; border-radius:8px; display:inline-block; font-size:14px; }
.app-header a:hover{ background: rgba(255,255,255,0.03); transform: translateY(-1px); transition: all 120ms ease; }

/* Protected link */
.protected-link{ opacity:0.6; cursor: pointer; position:relative; outline:none; }
.protected-link::after{ content: '🔒'; margin-left:6px; font-size:12px; opacity:0.7; }

/* Sidebar */
.app-layout{ display:flex; gap:18px; align-items:flex-start; padding-top:12px; }
.sidebar{ width:260px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); padding:14px; border-radius:12px; height: calc(100vh - 88px); position:sticky; top:76px; overflow:auto; box-shadow: 0 6px 20px rgba(2,6,23,0.6); }
.main{ flex:1; min-height: calc(100vh - 120px); padding-bottom:60px; }

/* Cards */
.card{ background: var(--card-bg); padding:16px; border-radius:var(--radius); box-shadow: 0 8px 30px rgba(2,6,23,0.6); border: 1px solid rgba(255,255,255,0.03); margin-bottom: var(--gap); }

/* Modal styles */
.protected-modal{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(2,6,23,0.6); visibility:hidden; opacity:0; transition: all 180ms ease; z-index:80; }
.protected-modal.open{ visibility:visible; opacity:1; }
.protected-modal-card{ width:380px; background: linear-gradient(180deg, #071428, #041025); padding:18px; border-radius:12px; border:1px solid rgba(255,255,255,0.04); box-shadow: 0 8px 30px rgba(2,6,23,0.7); color:#dbeafe; }
.protected-modal-card h3{ margin:0 0 8px 0; }
.protected-modal-card p{ margin:0 0 16px 0; color:var(--muted-600); }
.protected-modal-actions{ display:flex; gap:8px; justify-content:flex-end; }
.protected-modal button{ background:transparent; color:var(--brand-500); border:1px solid rgba(255,255,255,0.04); padding:8px 10px; border-radius:8px; cursor:pointer; }

/* responsive */
@media (max-width:900px){
  .sidebar{ position:relative; width:100%; height:auto; top:0; }
  .app-layout{ flex-direction:column; }
  .app-header nav{ gap:6px; }
}
