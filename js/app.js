/* ============================
   APP.JS — Shared Utilities
   ============================ */

const DB_KEY = 'dutauinssc_pendaftar';
const SETTINGS_KEY = 'dutauinssc_settings';

const DB = {
  getAll: () => JSON.parse(localStorage.getItem(DB_KEY) || '[]'),
  save: (data) => localStorage.setItem(DB_KEY, JSON.stringify(data)),
  add: (item) => {
    const all = DB.getAll();
    const newItem = { ...item, id: Date.now(), createdAt: new Date().toISOString(), status: 'pending' };
    all.push(newItem); DB.save(all); return newItem;
  },
  getById: (id) => DB.getAll().find(i => i.id === parseInt(id)),
  updateStatus: (id, status) => {
    DB.save(DB.getAll().map(i => i.id === parseInt(id) ? { ...i, status, updatedAt: new Date().toISOString() } : i));
  },
  delete: (id) => DB.save(DB.getAll().filter(i => i.id !== parseInt(id))),
};

const Settings = {
  get: () => JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"pendaftaranOpen":true,"adminUser":"rasikinganteng","adminPass":"ghoriztea2026"}'),
  save: (s) => localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)),
  isPendaftaranOpen: () => Settings.get().pendaftaranOpen,
  toggle: () => { const s = Settings.get(); s.pendaftaranOpen = !s.pendaftaranOpen; Settings.save(s); return s.pendaftaranOpen; },
};

function showToast(msg, type = 'default', duration = 3500) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 40);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 320); }, duration);
}

function initScrollReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function seedDemoData() {
  if (DB.getAll().length > 0) return;
  const demo = [
    { namaLengkap:'Anisa Rahma Putri', nim:'2301010001', prodi:'Islamic Communication and Broadcasting', semester:'5', jenisKelamin:'Female', ttl:'Cirebon, 12 January 2004', noHp:'081234567890', email:'anisa@student.uinssc.ac.id', alamat:'Jl. Kesambi No.15 Cirebon', ipk:'3.85', prestasi:'1st place – Arabic Debate Competition', organisasi:'HMPS KPI, Student Journalism Society', motivasi:'I want to represent the best of UIN SSC at national and international forums. My background in communication and journalism gives me the tools to connect with diverse audiences and build the university\'s public image in a meaningful way. I believe the role of an ambassador is not just ceremonial but a genuine platform for positive impact. I am committed to using this position to serve my campus community with integrity and dedication. Through this programme I hope to grow as a leader while inspiring my peers to reach for excellence in everything they do.', visi:'To establish a visible and respected presence for UIN SSC across regional and national platforms, particularly in digital and academic spaces.', status:'diterima', createdAt: new Date(Date.now()-7*86400000).toISOString(), id: Date.now()-7*86400000 },
    { namaLengkap:'Muhammad Fauzi Ramadan', nim:'2301020002', prodi:'Informatics Engineering', semester:'3', jenisKelamin:'Male', ttl:'Indramayu, 5 March 2005', noHp:'082345678901', email:'fauzi@student.uinssc.ac.id', alamat:'Jl. Cipto No.22 Cirebon', ipk:'3.72', prestasi:'Finalist – West Java Regional Hackathon', organisasi:'Robotics Student Society', motivasi:'As an informatics student at an Islamic university, I want to show that technological excellence and strong Islamic values are not in conflict. I am applying to this programme because I believe the campus ambassador role is an opportunity to bridge the gap between the technical and humanistic dimensions of university life. I am passionate about digital communication and have experience in social media content creation, which I believe is increasingly important for university outreach. I will bring a fresh, data-informed perspective to the ambassador role.', visi:'To position UIN SSC as a forward-thinking institution that leads at the intersection of Islamic values and digital innovation.', status:'pending', createdAt: new Date(Date.now()-3*86400000).toISOString(), id: Date.now()-3*86400000 },
    { namaLengkap:'Siti Nurhaliza Azzahra', nim:'2301030003', prodi:'Islamic Family Law', semester:'7', jenisKelamin:'Female', ttl:'Kuningan, 20 July 2003', noHp:'083456789012', email:'siti@student.uinssc.ac.id', alamat:'Jl. Siliwangi No.8 Cirebon', ipk:'3.91', prestasi:'Best Student – Faculty Level 2025', organisasi:'Student Executive Board, Campus Press', motivasi:'Four years of active involvement in student leadership have prepared me for the responsibilities of this role. I understand the demands of representing an institution publicly and I take those responsibilities seriously. My experience as a member of the Student Executive Board has given me direct insight into how institutional image is shaped by the behaviour and communication of its representatives. I want to use this position to set a high standard for future ambassadors and to strengthen the community bonds within our campus. Excellence in this role requires both visible achievement and quiet, consistent service.', visi:'To build a campus culture where students are proud of their identity and eager to represent UIN SSC with confidence and integrity.', status:'ditolak', createdAt: new Date(Date.now()-1*86400000).toISOString(), id: Date.now()-1*86400000 },
    { namaLengkap:'Rizky Aditya Nugraha', nim:'2301040004', prodi:'Islamic Economics', semester:'5', jenisKelamin:'Male', ttl:'Majalengka, 17 August 2004', noHp:'084567890123', email:'rizky@student.uinssc.ac.id', alamat:'Jl. Kartini No.30 Cirebon', ipk:'3.65', prestasi:'2nd Place – Business Plan Competition', organisasi:'Islamic Economics Student Association', motivasi:'My interest in this programme comes from a genuine desire to contribute to how UIN SSC is perceived both within and beyond the Cirebon region. As a student of Islamic Economics, I am aware that how institutions present themselves matters enormously for public trust. I want to apply my knowledge of branding and communication to help the university reach new audiences. I am particularly interested in developing the ambassador programme\'s presence on social media and in youth-oriented national forums. I am committed to making this more than just a title.', visi:'To leverage digital platforms to expand UIN SSC\'s reach and position it as a national leader in Islamic higher education.', status:'pending', createdAt: new Date().toISOString(), id: Date.now() },
  ];
  localStorage.setItem(DB_KEY, JSON.stringify(demo));
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  seedDemoData();
});
