/* ============================
   FORM.JS — Multi-step Logic
   ============================ */

let currentStep = 1;
let photoDataURL = '';

document.addEventListener('DOMContentLoaded', () => {
  if (!Settings.isPendaftaranOpen()) {
    document.getElementById('formWrapper').classList.add('hidden');
    document.getElementById('closedNotice').classList.remove('hidden');
  }
});

function nextStep(from) {
  if (!validateStep(from)) return;
  document.getElementById('formStep' + from).classList.remove('active');
  document.getElementById('step-indicator-' + from).classList.remove('active');
  document.getElementById('step-indicator-' + from).classList.add('done');
  currentStep = from + 1;
  document.getElementById('formStep' + currentStep).classList.add('active');
  document.getElementById('step-indicator-' + currentStep).classList.add('active');
  if (currentStep === 3) buildReview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function prevStep(from) {
  document.getElementById('formStep' + from).classList.remove('active');
  document.getElementById('step-indicator-' + from).classList.remove('active');
  currentStep = from - 1;
  document.getElementById('step-indicator-' + currentStep).classList.remove('done');
  document.getElementById('step-indicator-' + currentStep).classList.add('active');
  document.getElementById('formStep' + currentStep).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.nextStep = nextStep;
window.prevStep = prevStep;

function validateStep(step) {
  let valid = true;
  const setErr = (id, msg) => {
    const el = document.getElementById(id);
    const err = document.getElementById('err-' + id);
    if (!el || !err) return;
    if (!el.value.trim()) {
      el.classList.add('error'); err.textContent = msg; err.classList.add('show'); valid = false;
    } else { el.classList.remove('error'); err.classList.remove('show'); }
  };

  if (step === 1) {
    setErr('namaLengkap', 'Full name is required.');
    setErr('nim', 'Student ID number is required.');
    setErr('jenisKelamin', 'Please select your gender.');
    setErr('prodi', 'Please select your study programme.');
    setErr('semester', 'Please select your current semester.');
    setErr('ttl', 'Place and date of birth are required.');
    setErr('noHp', 'Mobile number is required.');
    setErr('email', 'Email address is required.');
    setErr('alamat', 'Address is required.');
    setErr('tinggiBadan', 'Height is required.');
    const email = document.getElementById('email');
    const emailErr = document.getElementById('err-email');
    if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.classList.add('error'); emailErr.textContent = 'Please enter a valid email address.'; emailErr.classList.add('show'); valid = false;
    }
    const tb = document.getElementById('tinggiBadan');
    const jk = document.getElementById('jenisKelamin');
    const tbErr = document.getElementById('err-tinggiBadan');
    if (tb && jk && tb.value) {
      const minH = jk.value === 'Female' ? 158 : 168;
      if (parseInt(tb.value) < minH) {
        tb.classList.add('error'); tbErr.textContent = `Minimum height for ${jk.value} applicants is ${minH} cm.`; tbErr.classList.add('show'); valid = false;
      }
    }
  }
  if (step === 2) {
    const ipk = document.getElementById('ipk');
    const ipkErr = document.getElementById('err-ipk');
    if (ipk && (parseFloat(ipk.value) < 3.0 || !ipk.value)) {
      ipk.classList.add('error'); ipkErr.textContent = 'Minimum GPA required is 3.00.'; ipkErr.classList.add('show'); valid = false;
    } else if (ipk) { ipk.classList.remove('error'); ipkErr.classList.remove('show'); }
    const motivasi = document.getElementById('motivasi');
    const motivasiErr = document.getElementById('err-motivasi');
    if (motivasi) {
      const words = motivasi.value.trim().split(/\s+/).filter(Boolean).length;
      if (words < 100) {
        motivasi.classList.add('error'); motivasiErr.textContent = `Your statement is ${words} word(s). Minimum 100 words required.`; motivasiErr.classList.add('show'); valid = false;
      } else { motivasi.classList.remove('error'); motivasiErr.classList.remove('show'); }
    }
    const visi = document.getElementById('visi');
    const visiErr = document.getElementById('err-visi');
    if (visi && !visi.value.trim()) {
      visi.classList.add('error'); visiErr.textContent = 'This field is required.'; visiErr.classList.add('show'); valid = false;
    } else if (visi) { visi.classList.remove('error'); visiErr.classList.remove('show'); }
  }
  if (!valid) { const first = document.querySelector('.error'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  return valid;
}

const motivasiField = document.getElementById('motivasi');
const motivasiCount = document.getElementById('motivasiCount');
if (motivasiField && motivasiCount) {
  motivasiField.addEventListener('input', () => {
    const words = motivasiField.value.trim().split(/\s+/).filter(Boolean).length;
    motivasiCount.textContent = words;
    motivasiCount.style.color = words >= 100 ? 'var(--gold-dark)' : 'var(--text-light)';
  });
}

function handlePhotoUpload(input) {
  const file = input.files[0];
  const err = document.getElementById('err-foto');
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { err.textContent = 'File size must not exceed 2 MB.'; err.classList.add('show'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    photoDataURL = e.target.result;
    const preview = document.getElementById('fotoPreviewImg');
    document.getElementById('uploadPlaceholder').style.display = 'none';
    preview.src = photoDataURL; preview.classList.remove('hidden'); err.classList.remove('show');
  };
  reader.readAsDataURL(file);
}
window.handlePhotoUpload = handlePhotoUpload;

function buildReview() {
  const data = collectFormData();
  const grid = document.getElementById('reviewGrid');
  if (!grid) return;
  const items = [
    { label: 'Full Name', value: data.namaLengkap, full: true },
    { label: 'NIM', value: data.nim },
    { label: 'Gender', value: data.jenisKelamin },
    { label: 'Programme', value: data.prodi },
    { label: 'Semester', value: data.semester },
    { label: 'Date of Birth', value: data.ttl },
    { label: 'Mobile', value: data.noHp },
    { label: 'Email', value: data.email },
    { label: 'Height', value: data.tinggiBadan ? data.tinggiBadan + ' cm' : '-' },
    { label: 'GPA', value: data.ipk },
    { label: 'Address', value: data.alamat, full: true },
    { label: 'Motivation', value: data.motivasi ? data.motivasi.substring(0, 120) + '...' : '-', full: true },
  ];
  grid.innerHTML = items.map(i => `
    <div class="review-item ${i.full ? 'full' : ''}">
      <div class="review-item-label">${i.label}</div>
      <div class="review-item-value">${i.value || '—'}</div>
    </div>`).join('');
}

function collectFormData() {
  const val = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  return {
    namaLengkap: val('namaLengkap'), nim: val('nim'), jenisKelamin: val('jenisKelamin'),
    prodi: val('prodi'), semester: val('semester'), ttl: val('ttl'),
    noHp: val('noHp'), email: val('email'), alamat: val('alamat'),
    tinggiBadan: val('tinggiBadan'), instagram: val('instagram'),
    ipk: val('ipk'), statusMahasiswa: val('statusMahasiswa'),
    prestasi: val('prestasi'), organisasi: val('organisasi'),
    motivasi: val('motivasi'), visi: val('visi'), bakatKemampuan: val('bakatKemampuan'),
    foto: photoDataURL || null,
  };
}

function toggleSubmit() {
  const check = document.getElementById('agreeCheck');
  const btn = document.getElementById('submitBtn');
  if (btn) btn.disabled = !check.checked;
}
window.toggleSubmit = toggleSubmit;

function submitForm(e) {
  e.preventDefault();
  const check = document.getElementById('agreeCheck');
  if (!check?.checked) return;
  if (!photoDataURL) {
    const err = document.getElementById('err-foto');
    err.textContent = 'A profile photograph is required.'; err.classList.add('show'); return;
  }
  const data = collectFormData();
  const saved = DB.add(data);
  document.getElementById('formWrapper').classList.add('hidden');
  const screen = document.getElementById('successScreen');
  screen.classList.remove('hidden');
  document.getElementById('successName').textContent = data.namaLengkap;
  document.getElementById('successId').textContent = '#' + String(saved.id).slice(-8).toUpperCase();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.submitForm = submitForm;

document.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => {
    el.classList.remove('error');
    const err = document.getElementById('err-' + el.id);
    if (err) err.classList.remove('show');
  });
});
