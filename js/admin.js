/* ============================
   ADMIN.JS — Dashboard Logic
   ============================ */

let currentPage = 'dashboard';
let sortKey = 'createdAt';
let sortDir = -1;

const dateEl = document.getElementById('topbarDate');
if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

function doLogin(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser')?.value.trim();
  const pass = document.getElementById('loginPass')?.value;
  const s = Settings.get();
  if (user === 'admin' && pass === s.adminPass) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    refreshDashboard();
  } else {
    const err = document.getElementById('loginError');
    err?.classList.remove('hidden');
    setTimeout(() => err?.classList.add('hidden'), 3000);
  }
}
window.doLogin = doLogin;

function doLogout() {
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
}
window.doLogout = doLogout;

function togglePass() {
  const inp = document.getElementById('loginPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}
window.togglePass = togglePass;

function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1)).classList.add('active');
  document.getElementById('nav' + page.charAt(0).toUpperCase() + page.slice(1)).classList.add('active');
  const titles = { dashboard: 'Overview', pendaftar: 'Applicants', settings: 'Settings' };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  currentPage = page;
  if (page === 'dashboard') renderDashboard();
  if (page === 'pendaftar') renderTable();
  if (page === 'settings') renderSettings();
  document.getElementById('sidebar').classList.remove('open');
}
window.showPage = showPage;

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
window.toggleSidebar = toggleSidebar;

function getCombinedApplicants() {
  const pendaftar = DB.getAll();
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem('dutauinssc_users') || '[]');
  } catch (e) {}

  const merged = [...pendaftar];
  users.forEach(u => {
    if (!merged.some(m => m.email && m.email.toLowerCase() === u.email.toLowerCase())) {
      merged.unshift({
        id: u.id || Date.now(),
        namaLengkap: u.namaLengkap || u.name,
        nim: u.nim || '—',
        prodi: u.jurusan || u.fakultas || '—',
        semester: '—',
        jenisKelamin: u.jenisKelamin || '—',
        email: u.email,
        status: u.accountStatus === 'approved' ? 'diterima' : (u.accountStatus === 'rejected' ? 'ditolak' : 'pending'),
        createdAt: u.createdAt || new Date().toISOString()
      });
    }
  });
  return merged;
}

function refreshDashboard() {
  const all = getCombinedApplicants();
  const nb = document.getElementById('navBadge');
  if (nb) nb.textContent = all.length;
  if (currentPage === 'dashboard') renderDashboard();
  if (currentPage === 'pendaftar') renderTable();
}

function renderDashboard() {
  const all = getCombinedApplicants();
  const pending = all.filter(i => i.status === 'pending');
  const diterima = all.filter(i => i.status === 'diterima');
  const ditolak = all.filter(i => i.status === 'ditolak');
  si('statTotal', all.length); si('statPending', pending.length); si('statDiterima', diterima.length); si('statDitolak', ditolak.length);

  const total = all.length || 1;
  const circ = 2 * Math.PI * 56;
  const pP = (pending.length / total) * circ;
  const pD = (diterima.length / total) * circ;
  const pR = (ditolak.length / total) * circ;
  setDash('donut-pending', pP, circ, 0);
  setDash('donut-diterima', pD, circ, pP);
  setDash('donut-ditolak', pR, circ, pP + pD);
  si('donutTotal', all.length);

  const recentList = document.getElementById('recentList');
  if (recentList) {
    const sorted = [...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    recentList.innerHTML = sorted.length ? sorted.map(item => `
      <div class="recent-item">
        <div class="recent-avatar">${item.foto ? `<img src="${item.foto}" alt="">` : (item.namaLengkap?.charAt(0) || '?')}</div>
        <div style="flex:1;min-width:0">
          <div class="recent-name">${item.namaLengkap || '—'}</div>
          <div class="recent-sub">${(item.prodi || '').substring(0, 32)}${(item.prodi||'').length>32?'…':''} · ${formatDate(item.createdAt)}</div>
        </div>
        ${statusBadge(item.status)}
      </div>`).join('') : '<p style="color:var(--text-light);font-size:0.875rem;padding:0.5rem 0">No applications yet.</p>';
  }

  const prodiMap = {};
  all.forEach(i => { if (i.prodi) prodiMap[i.prodi] = (prodiMap[i.prodi] || 0) + 1; });
  const maxP = Math.max(...Object.values(prodiMap), 1);
  const prodiBars = document.getElementById('prodiBars');
  if (prodiBars) {
    const entries = Object.entries(prodiMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    prodiBars.innerHTML = entries.length ? entries.map(([p, c]) => `
      <div class="prodi-bar-item">
        <div class="prodi-bar-label"><span>${p.length > 32 ? p.substring(0,32)+'…' : p}</span><span>${c}</span></div>
        <div class="prodi-bar-track"><div class="prodi-bar-fill" style="width:${(c/maxP)*100}%"></div></div>
      </div>`).join('') : '<p style="color:var(--text-light);font-size:0.875rem">No data yet.</p>';
  }
}

function setDash(id, dash, full, offset) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.strokeDasharray = `${dash} ${full - dash}`;
  el.style.strokeDashoffset = -offset;
}

function renderTable() {
  let all = getCombinedApplicants();
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const fStatus = document.getElementById('filterStatus')?.value || '';
  const fProdi = document.getElementById('filterProdi')?.value || '';

  const prodis = [...new Set(all.map(i => i.prodi).filter(Boolean))];
  const prodiFilter = document.getElementById('filterProdi');
  if (prodiFilter && prodiFilter.options.length <= 1) {
    prodis.forEach(p => { const o = document.createElement('option'); o.value = p; o.textContent = p; prodiFilter.appendChild(o); });
  }

  let filtered = all.filter(i => {
    const m = !search || [i.namaLengkap,i.nim,i.prodi,i.email].some(v => (v||'').toLowerCase().includes(search));
    return m && (!fStatus || i.status === fStatus) && (!fProdi || i.prodi === fProdi);
  });

  filtered.sort((a, b) => {
    let av = a[sortKey] || '', bv = b[sortKey] || '';
    if (sortKey === 'createdAt') { av = new Date(av); bv = new Date(bv); }
    return av < bv ? -sortDir : av > bv ? sortDir : 0;
  });

  const tbody = document.getElementById('pendaftarTableBody');
  const empty = document.getElementById('tableEmpty');
  const info = document.getElementById('tableInfo');
  if (!tbody) return;

  if (!filtered.length) { tbody.innerHTML = ''; empty?.classList.remove('hidden'); if(info) info.textContent = ''; return; }
  empty?.classList.add('hidden');
  if (info) info.textContent = `Showing ${filtered.length} of ${all.length} applicant(s)`;

  tbody.innerHTML = filtered.map((item, idx) => `
    <tr>
      <td style="color:var(--text-light)">${idx+1}</td>
      <td><div class="td-name">${item.namaLengkap||'—'}</div><div style="font-size:0.72rem;color:var(--text-light)">${item.email||'—'}</div></td>
      <td class="td-nim">${item.nim||'—'}</td>
      <td style="font-size:0.8rem;max-width:180px">${item.prodi||'—'}</td>
      <td style="text-align:center;font-size:0.82rem">${item.semester||'—'}</td>
      <td style="font-size:0.78rem;color:var(--text-light);white-space:nowrap">${formatDate(item.createdAt)}</td>
      <td>${statusBadge(item.status)}</td>
      <td><div class="td-actions">
        <button class="btn btn-outline-gold btn-sm" onclick="openDetail(${item.id})">View</button>
        ${item.status!=='diterima'?`<button class="btn btn-success btn-sm" onclick="updateStatus(${item.id},'diterima')">Accept</button>`:''}
        ${item.status!=='ditolak'?`<button class="btn btn-danger btn-sm" onclick="updateStatus(${item.id},'ditolak')">Reject</button>`:''}
        <button class="btn btn-sm" style="border:1px solid var(--border-soft);color:var(--text-light)" onclick="deleteItem(${item.id})">Delete</button>
      </div></td>
    </tr>`).join('');
}
function filterTable() { renderTable(); }
window.filterTable = filterTable;
function sortTable(key) { if(sortKey===key) sortDir*=-1; else { sortKey=key; sortDir=1; } renderTable(); }
window.sortTable = sortTable;

function updateStatus(id, status) {
  DB.updateStatus(id, status);
  // Also sync to dutauinssc_users
  try {
    const raw = localStorage.getItem('dutauinssc_users');
    if (raw) {
      const users = JSON.parse(raw);
      const allRecs = getCombinedApplicants();
      const target = allRecs.find(r => r.id === parseInt(id));
      if (target && target.email) {
        const uIdx = users.findIndex(u => u.email.toLowerCase() === target.email.toLowerCase());
        if (uIdx !== -1) {
          users[uIdx].accountStatus = status === 'diterima' ? 'approved' : (status === 'ditolak' ? 'rejected' : 'pending');
          users[uIdx].status = status === 'diterima' ? 'Disetujui' : (status === 'ditolak' ? 'Ditolak' : 'Menunggu Persetujuan');
          localStorage.setItem('dutauinssc_users', JSON.stringify(users));
        }
      }
    }
  } catch (e) {}

  showToast(`Status updated to "${status === 'diterima' ? 'accepted' : 'rejected'}"`, status==='diterima'?'success':'error');
  refreshDashboard();
  if (currentPage==='pendaftar') renderTable();
  const modal = document.getElementById('detailModal');
  if (modal.classList.contains('open')) openDetail(id);
}
window.updateStatus = updateStatus;

function deleteItem(id) {
  if (!confirm('Delete this applicant record? This cannot be undone.')) return;
  DB.delete(id); showToast('Record deleted.', 'error'); refreshDashboard();
  if (currentPage==='pendaftar') renderTable();
}
window.deleteItem = deleteItem;

function openDetail(id) {
  const item = DB.getById(id);
  if (!item) return;
  const content = document.getElementById('modalContent');
  const avatar = item.foto
    ? `<img src="${item.foto}" class="modal-photo" alt="">`
    : `<div style="width:80px;height:80px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:#fff;margin:0 auto 1rem">${item.namaLengkap?.charAt(0)||'?'}</div>`;
  content.innerHTML = `
    ${avatar}
    <div class="modal-name">${item.namaLengkap||'—'}</div>
    <div class="modal-prodi">${item.prodi||'—'} · Semester ${item.semester||'—'}</div>
    <div style="text-align:center;margin-bottom:1.5rem">${statusBadge(item.status)}</div>
    <div class="modal-detail-grid">
      <div class="modal-detail-item"><div class="modal-detail-label">NIM</div><div class="modal-detail-value">${item.nim||'—'}</div></div>
      <div class="modal-detail-item"><div class="modal-detail-label">Gender</div><div class="modal-detail-value">${item.jenisKelamin||'—'}</div></div>
      <div class="modal-detail-item"><div class="modal-detail-label">Date of Birth</div><div class="modal-detail-value">${item.ttl||'—'}</div></div>
      <div class="modal-detail-item"><div class="modal-detail-label">Mobile</div><div class="modal-detail-value">${item.noHp||'—'}</div></div>
      <div class="modal-detail-item"><div class="modal-detail-label">Email</div><div class="modal-detail-value">${item.email||'—'}</div></div>
      <div class="modal-detail-item"><div class="modal-detail-label">GPA</div><div class="modal-detail-value">${item.ipk||'—'}</div></div>
      <div class="modal-detail-item"><div class="modal-detail-label">Height</div><div class="modal-detail-value">${item.tinggiBadan?item.tinggiBadan+' cm':'—'}</div></div>
      <div class="modal-detail-item"><div class="modal-detail-label">Instagram</div><div class="modal-detail-value">${item.instagram||'—'}</div></div>
      <div class="modal-detail-item full"><div class="modal-detail-label">Address</div><div class="modal-detail-value">${item.alamat||'—'}</div></div>
      <div class="modal-detail-item full"><div class="modal-detail-label">Achievements</div><div class="modal-detail-value">${item.prestasi||'—'}</div></div>
      <div class="modal-detail-item full"><div class="modal-detail-label">Organisations</div><div class="modal-detail-value">${item.organisasi||'—'}</div></div>
      <div class="modal-detail-item full"><div class="modal-detail-label">Applied on</div><div class="modal-detail-value">${formatDateTime(item.createdAt)}</div></div>
    </div>
    <p style="font-size:0.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-light);margin-bottom:0.5rem">Motivation Statement</p>
    <div class="modal-quote">${item.motivasi||'—'}</div>
    <p style="font-size:0.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text-light);margin-bottom:0.5rem">Vision as Ambassador</p>
    <div class="modal-quote">${item.visi||'—'}</div>
    <div class="modal-actions">
      ${item.status!=='diterima'?`<button class="btn btn-success" onclick="updateStatus(${item.id},'diterima')">Accept Applicant</button>`:''}
      ${item.status!=='ditolak'?`<button class="btn btn-danger" onclick="updateStatus(${item.id},'ditolak')">Reject Applicant</button>`:''}
      <button class="btn btn-outline-gold" onclick="closeModal()">Close</button>
    </div>`;
  document.getElementById('modalTitle').textContent = item.namaLengkap;
  document.getElementById('detailModal').classList.add('open');
}
window.openDetail = openDetail;

function closeModal() { document.getElementById('detailModal').classList.remove('open'); }
window.closeModal = closeModal;
document.getElementById('detailModal')?.addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });

function exportCSV() {
  const all = DB.getAll();
  if (!all.length) { showToast('No data to export.', 'error'); return; }
  const headers = ['ID','Full Name','NIM','Programme','Semester','Gender','Date of Birth','Mobile','Email','Address','Height (cm)','GPA','Achievements','Organisations','Motivation','Vision','Status','Applied On'];
  const rows = all.map(i => [i.id,i.namaLengkap,i.nim,i.prodi,i.semester,i.jenisKelamin,i.ttl,i.noHp,i.email,i.alamat,i.tinggiBadan,i.ipk,i.prestasi,i.organisasi,i.motivasi,i.visi,i.status,formatDateTime(i.createdAt)].map(v=>`"${String(v||'').replace(/"/g,'""')}"`));
  const csv = [headers.join(','),...rows.map(r=>r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`applicants-uinssc-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast(`${all.length} records exported.`, 'success');
}
window.exportCSV = exportCSV;

function renderSettings() {
  const s = Settings.get();
  const toggle = document.getElementById('regToggle');
  if (toggle) toggle.checked = s.pendaftaranOpen;
  updateRegLabel(s.pendaftaranOpen);
  const it = document.getElementById('infoTotal');
  if (it) it.textContent = DB.getAll().length + ' records';
}

function toggleRegistration() { const open = Settings.toggle(); updateRegLabel(open); showToast(open?'Applications are now open.':'Applications are now closed.', open?'success':'error'); }
window.toggleRegistration = toggleRegistration;

function updateRegLabel(open) {
  const label = document.getElementById('regStatusLabel');
  const hint = document.getElementById('regHint');
  if (label) label.innerHTML = `Applications: <strong style="color:${open?'#16a34a':'#dc2626'}">${open?'Open':'Closed'}</strong>`;
  if (hint) hint.textContent = open ? 'Applications are currently open. Candidates can submit their forms.' : 'Applications are closed. The form is not accessible to candidates.';
}

function changePassword() {
  const cur = document.getElementById('curPass')?.value;
  const newP = document.getElementById('newPass')?.value;
  const conf = document.getElementById('confirmPass')?.value;
  const s = Settings.get();
  if (cur !== s.adminPass) { showToast('Current password is incorrect.', 'error'); return; }
  if (!newP || newP.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
  if (newP !== conf) { showToast('Passwords do not match.', 'error'); return; }
  s.adminPass = newP; Settings.save(s);
  showToast('Password updated successfully.', 'success');
  ['curPass','newPass','confirmPass'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
}
window.changePassword = changePassword;

function clearData() {
  if (!confirm('Delete all data? This cannot be undone.')) return;
  localStorage.removeItem('dutauinssc_pendaftar');
  refreshDashboard(); renderTable(); showToast('All data cleared.', 'error');
}
window.clearData = clearData;

function si(id, val) { const el = document.getElementById(id); if(el) el.textContent = val; }

function statusBadge(status) {
  const map = { pending:'badge-pending', diterima:'badge-success', ditolak:'badge-danger' };
  const labels = { pending:'Pending', diterima:'Accepted', ditolak:'Rejected' };
  return `<span class="badge ${map[status]||'badge-gold'}">${labels[status]||status}</span>`;
}

document.addEventListener('DOMContentLoaded', () => { seedDemoData(); });
