import React, { useState, useEffect } from 'react';
import { useRouter } from '../lib/router';
import Link from '../components/Link';
import Image from '../components/Image';
import { DB } from '../lib/db';
import { Settings } from '../lib/settings';
import { Auth } from '../lib/auth';
import RegisterAccountWizard from '../components/RegisterAccountWizard';

const Field = ({ id, label, required, error, children }) => (
  <div className={`form-group ${id === 'alamat' ? 'full' : ''}`}>
    <label htmlFor={id}>
      {label} {required && <span className="required">*</span>}
    </label>
    {children}
    {error && <span className="field-error show">{error}</span>}
  </div>
);

export default function DaftarPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Document fulfillment steps (Step 4) for approved users
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    namaLengkap: '',
    nim: '',
    prodi: '',
    fakultas: '',
    semester: '',
    jenisKelamin: '',
    ttl: '',
    noHp: '',
    email: '',
    alamat: '',
    tinggiBadan: '',
    instagram: '',
    ipk: '',
    statusMahasiswa: 'Mahasiswa Aktif',
    prestasi: '',
    organisasi: '',
    motivasi: '',
    visi: '',
    bakatKemampuan: '',
  });

  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [motivasiWords, setMotivasiWords] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const user = Auth.getCurrentUser();
    if (user) {
      router.push('/profil');
    } else {
      router.push('/login');
    }
  }, [router]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const inputProps = (k) => ({
    value: data[k],
    onChange: (e) => set(k, e.target.value),
    className: errors[k] ? 'error' : '',
  });

  const validateStep = (s) => {
    const err = {};
    if (s === 1) {
      if (!data.namaLengkap.trim()) err.namaLengkap = 'Nama lengkap wajib diisi';
      if (!data.nim.trim()) err.nim = 'NIM wajib diisi';
      if (!data.prodi.trim()) err.prodi = 'Program studi wajib diisi';
      if (!data.semester) err.semester = 'Semester wajib diisi';
      if (!data.jenisKelamin) err.jenisKelamin = 'Pilih jenis kelamin';
      if (!data.ttl.trim()) err.ttl = 'Tempat, Tanggal Lahir wajib diisi';
      if (!data.noHp.trim()) err.noHp = 'Nomor HP wajib diisi';
      if (!data.email.trim() || !/\S+@\S+\.\S+/.test(data.email)) err.email = 'Email valid wajib diisi';
      if (!data.alamat.trim()) err.alamat = 'Alamat wajib diisi';
    }
    if (s === 2) {
      if (!data.ipk || data.ipk < 0 || data.ipk > 4) err.ipk = 'IPK tidak valid';
      if (motivasiWords < 100) err.motivasi = 'Surat motivasi minimal 100 kata';
      if (!data.visi.trim()) err.visi = 'Visi wajib diisi';
    }
    if (s === 3) {
      if (!photo) err.foto = 'Pas foto profil wajib diunggah';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep((s) => s - 1);
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran foto maksimal 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(ev.target.result);
      setErrors((err) => ({ ...err, foto: null }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);

    try {
      DB.insert({ ...data, photo });
      Auth.updateStatus(data.email, 'Sedang Diverifikasi');
      setSubmitted(true);
    } catch {
      alert('Terjadi kesalahan saat menyimpan formulir.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) return null;

  // CASE 1: USER NOT LOGGED IN -> SHOW 2-STEP ACCOUNT REGISTRATION WIZARD
  if (!currentUser) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: '100%', maxWidth: '580px', marginBottom: '1rem' }}>
          <Link
            href="/"
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-mid)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 500
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Kembali ke Beranda
          </Link>
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: '580px',
            padding: '2.5rem 2rem',
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <Image
              src="/assets/logo-circle.png"
              alt="Logo UIN Siber Cirebon"
              width={56}
              height={56}
              style={{ margin: '0 auto 0.75rem', display: 'block' }}
            />
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--navy)', margin: '0 0 0.35rem' }}>
              Pendaftaran Akun Baru
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-mid)', margin: 0, lineHeight: 1.5 }}>
              Daftarkan akun untuk memulai proses pengajuan seleksi Duta Kampus 2026.
            </p>
          </div>

          <RegisterAccountWizard onSwitchToLogin={() => router.push('/login')} />
        </div>
      </div>
    );
  }

  // CASE 2: USER ACCOUNT IS STILL PENDING ACC FROM ADMIN
  if (currentUser.accountStatus !== 'approved') {
    return (
      <main className="form-page" style={{ paddingTop: '60px' }}>
        <div className="form-wrapper" style={{ maxWidth: '680px' }}>
          <div className="form-header">
            <Image src="/assets/logo-main.png" alt="Logo" width={56} height={56} className="form-header-logo" />
            <div>
              <h1>
                Status Pengajuan <span className="text-gold">Akun Anda</span>
              </h1>
              <p>Akun Anda sedang dalam proses verifikasi oleh Panitia Seleksi.</p>
            </div>
          </div>

          <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(196,158,89,0.15)',
                color: 'var(--gold-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <div
              style={{
                display: 'inline-block',
                background: 'var(--gold)',
                color: '#fff',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '1rem',
              }}
            >
              Menunggu ACC Panitia
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.75rem' }}>
              Akun Anda Berhasil Diajukan!
            </h2>

            <p style={{ color: 'var(--text-mid)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 1.75rem' }}>
              Halo <strong>{currentUser.namaLengkap || currentUser.name}</strong>, data pengajuan akun Anda telah kami terima.
              Panitia sedang memverifikasi NIM dan identitas mahasiswa Anda. Begitu akun Anda disetujui (di-ACC),
              formulir pemenuhan berkas persyaratan (Step 4) akan langsung terbuka untuk diisi.
            </p>

            <div
              style={{
                background: 'var(--bg-alt)',
                border: '1px solid var(--border-soft)',
                borderRadius: '14px',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '2rem',
                fontSize: '0.875rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '0.5rem' }}>Ringkasan Akun:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: 'var(--text-mid)' }}>
                <div>NIM: <strong>{currentUser.nim || '-'}</strong></div>
                <div>Fakultas: <strong>{currentUser.fakultas || '-'}</strong></div>
                <div>Jurusan: <strong>{currentUser.jurusan || '-'}</strong></div>
                <div>Email: <strong>{currentUser.email}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/profil" className="btn btn-gold btn-lg" style={{ borderRadius: '12px', padding: '0.85rem 1.75rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>Buka Halaman Profil & Status</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // CASE 3: SUCCESSFUL FINAL SUBMISSION
  if (submitted) {
    return (
      <main className="form-page" style={{ paddingTop: '80px' }}>
        <div className="form-wrapper" style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.75rem' }}>
            Pendaftaran Berhasil Dikirim!
          </h2>
          <p style={{ color: 'var(--text-mid)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Seluruh berkas persyaratan Anda telah berhasil diunggah. Silakan pantau pengumuman hasil seleksi berkas di halaman profil Anda.
          </p>
          <Link href="/profil" className="btn btn-gold btn-lg">
            Kembali ke Profil Saya
          </Link>
        </div>
      </main>
    );
  }

  // CASE 4: USER ACCOUNT IS APPROVED -> SHOW FULL DOCUMENT FULFILLMENT FORM (STEP 4)
  return (
    <>
      <nav className="form-nav">
        <div className="container form-nav-inner">
          <Link href="/profil" className="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Kembali ke Profil
          </Link>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>
            Tahap 4: Pemenuhan Berkas & Dokumen
          </div>
        </div>
      </nav>

      <main className="form-page">
        <div className="form-wrapper">
          <div className="form-header">
            <Image src="/assets/logo-main.png" alt="Logo" width={56} height={56} className="form-header-logo" />
            <div>
              <h1>
                Formulir Berkas <span className="text-gold">Duta Kampus 2026</span>
              </h1>
              <p>Akun Anda telah di-ACC. Lengkapi berkas portofolio, IPK, dan motivasi di bawah ini.</p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="step-progress">
            {[
              ['01', 'Data Pribadi', 1],
              ['02', 'Akademik & Motivasi', 2],
              ['03', 'Foto & Konfirmasi', 3],
            ].map(([num, label, s]) => (
              <div key={s} className={`step-item ${step === s ? 'active' : step > s ? 'done' : ''}`}>
                <div className="step-circle">{num}</div>
                <div className="step-label">{label}</div>
              </div>
            ))}
          </div>

          {/* SUB-STEP 1: Data Pribadi Konfirmasi */}
          {step === 1 && (
            <div className="form-step active">
              <div className="step-title">
                <span className="step-num">01</span>
                <div>
                  <h2>Konfirmasi Identitas Diri</h2>
                  <p>Data dasar telah diisi dari akun Anda. Lengkapi semester, domisili, dan nomor WhatsApp.</p>
                </div>
              </div>
              <div className="form-grid">
                <Field id="namaLengkap" label="Nama Lengkap" required error={errors.namaLengkap}>
                  <input id="namaLengkap" type="text" placeholder="Sesuai KTP/KTM" {...inputProps('namaLengkap')} />
                </Field>
                <Field id="nim" label="NIM" required error={errors.nim}>
                  <input id="nim" type="text" placeholder="Nomor Induk Mahasiswa" {...inputProps('nim')} />
                </Field>
                <Field id="prodi" label="Program Studi" required error={errors.prodi}>
                  <input id="prodi" type="text" placeholder="Program Studi" {...inputProps('prodi')} />
                </Field>
                <Field id="semester" label="Semester" required error={errors.semester}>
                  <input id="semester" type="number" min={1} max={14} placeholder="Semester saat ini" {...inputProps('semester')} />
                </Field>
                <Field id="jenisKelamin" label="Jenis Kelamin" required error={errors.jenisKelamin}>
                  <select id="jenisKelamin" {...inputProps('jenisKelamin')}>
                    <option value="">Pilih jenis kelamin</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </Field>
                <Field id="ttl" label="Tempat, Tanggal Lahir" required error={errors.ttl}>
                  <input id="ttl" type="text" placeholder="Contoh: Cirebon, 12 Agustus 2004" {...inputProps('ttl')} />
                </Field>
                <Field id="noHp" label="Nomor HP / WhatsApp" required error={errors.noHp}>
                  <input id="noHp" type="tel" placeholder="08..." {...inputProps('noHp')} />
                </Field>
                <Field id="email" label="Email" required error={errors.email}>
                  <input id="email" type="email" placeholder="Email aktif" {...inputProps('email')} />
                </Field>
                <Field id="alamat" label="Alamat Domisili" required error={errors.alamat}>
                  <textarea id="alamat" rows={3} placeholder="Alamat domisili saat ini" {...inputProps('alamat')} />
                </Field>
                <Field id="tinggiBadan" label="Tinggi Badan (cm)" error={errors.tinggiBadan}>
                  <input id="tinggiBadan" type="number" min={100} max={250} placeholder="165" {...inputProps('tinggiBadan')} />
                </Field>
                <Field id="instagram" label="Username Instagram" error={errors.instagram}>
                  <input id="instagram" type="text" placeholder="@username" {...inputProps('instagram')} />
                </Field>
              </div>
              <div className="form-actions">
                <span />
                <button type="button" className="btn btn-gold btn-lg" onClick={nextStep}>
                  Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* SUB-STEP 2: Akademik & Motivasi */}
          {step === 2 && (
            <div className="form-step active">
              <div className="step-title">
                <span className="step-num">02</span>
                <div>
                  <h2>Akademik & Motivasi</h2>
                  <p>Ceritakan rekam jejak akademik dan alasan Anda mendaftar.</p>
                </div>
              </div>
              <div className="form-grid">
                <Field id="ipk" label="Indeks Prestasi Kumulatif (IPK)" required error={errors.ipk}>
                  <input id="ipk" type="number" step="0.01" min={0} max={4} placeholder="3.00 – 4.00" {...inputProps('ipk')} />
                </Field>
                <Field id="statusMahasiswa" label="Status Mahasiswa" error={errors.statusMahasiswa}>
                  <select id="statusMahasiswa" {...inputProps('statusMahasiswa')}>
                    <option value="Mahasiswa Aktif">Mahasiswa Aktif</option>
                    <option value="Penerima Beasiswa">Penerima Beasiswa</option>
                  </select>
                </Field>
                <div className="form-group full">
                  <label>Prestasi Akademik dan Non-Akademik</label>
                  <textarea rows={3} placeholder="Sebutkan perlombaan, penghargaan, atau prestasi yang pernah diraih" {...inputProps('prestasi')} />
                </div>
                <div className="form-group full">
                  <label>Pengalaman Organisasi</label>
                  <textarea rows={3} placeholder="Sebutkan organisasi yang pernah/sedang diikuti" {...inputProps('organisasi')} />
                </div>
                <div className="form-group full">
                  <label htmlFor="motivasi">Surat Motivasi <span className="required">*</span></label>
                  <textarea
                    id="motivasi"
                    rows={6}
                    placeholder="Jelaskan alasan Anda mendaftar (minimal 100 kata)"
                    value={data.motivasi}
                    onChange={(e) => {
                      set('motivasi', e.target.value);
                      setMotivasiWords(e.target.value.trim().split(/\s+/).filter(Boolean).length);
                    }}
                    className={errors.motivasi ? 'error' : ''}
                  />
                  <span className="field-hint" style={{ color: motivasiWords >= 100 ? 'var(--gold-dark)' : undefined }}>
                    {motivasiWords} kata (minimal 100 kata)
                  </span>
                  {errors.motivasi && <span className="field-error show">{errors.motivasi}</span>}
                </div>
                <div className="form-group full">
                  <label htmlFor="visi">Visi sebagai Duta Kampus <span className="required">*</span></label>
                  <textarea id="visi" rows={4} placeholder="Jika terpilih, apa yang ingin Anda capai sebagai Duta Kampus?" {...inputProps('visi')} />
                  {errors.visi && <span className="field-error show">{errors.visi}</span>}
                </div>
                <div className="form-group full">
                  <label>Bakat atau Keahlian Khusus</label>
                  <input type="text" placeholder="Contoh: Public Speaking, Menyanyi, Desain Grafis" {...inputProps('bakatKemampuan')} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline-gold btn-lg" onClick={prevStep}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg> Kembali
                </button>
                <button type="button" className="btn btn-gold btn-lg" onClick={nextStep}>
                  Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* SUB-STEP 3: Unggah Foto & Kirim */}
          {step === 3 && (
            <div className="form-step active">
              <div className="step-title">
                <span className="step-num">03</span>
                <div>
                  <h2>Unggah Foto & Pernyataan</h2>
                  <p>Unggah pas foto profil terbaru dan konfirmasi pengiriman berkas.</p>
                </div>
              </div>

              <div className="upload-section">
                <label className="upload-label">Pas Foto Profil <span className="required">*</span></label>
                <div className="upload-area" onClick={() => document.getElementById('fotoInput').click()}>
                  <div className="upload-preview-wrap">
                    {photo ? (
                      <img src={photo} alt="Preview" className="photo-preview" />
                    ) : (
                      <div className="upload-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p>Klik untuk mengunggah foto</p>
                        <span>JPG atau PNG, maksimal 2 MB</span>
                      </div>
                    )}
                  </div>
                </div>
                <input id="fotoInput" type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handlePhoto} />
                {errors.foto && <span className="field-error show">{errors.foto}</span>}
              </div>

              <div className="declaration-box">
                <h4>Pernyataan Komitmen</h4>
                <p>Dengan mengirimkan berkas pendaftaran ini, saya menyatakan bahwa data yang saya berikan adalah benar dan bersedia mengikuti seluruh tahapan seleksi Duta Kampus UIN SSC 2026.</p>
                <label className="checkbox-label" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--gold)' }} />
                  <span style={{ fontSize: '0.875rem' }}>Saya telah membaca dan menyetujui seluruh ketentuan seleksi.</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline-gold btn-lg" onClick={prevStep}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg> Kembali
                </button>
                <button
                  type="button"
                  className="btn btn-gold btn-lg"
                  onClick={handleSubmit}
                  disabled={!agreed || submitting}
                  style={{ opacity: agreed && !submitting ? 1 : 0.5, cursor: agreed ? 'pointer' : 'not-allowed' }}
                >
                  {submitting ? 'Mengirim Berkas...' : 'Kirim Berkas Pendaftaran Final'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
