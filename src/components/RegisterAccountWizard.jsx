import React, { useState, useId } from 'react';
import { useRouter } from '../lib/router';
import { Auth, validateEmailFormat } from '../lib/auth';
import { FAKULTAS_DATA, KEWARGANEGARAAN_OPTIONS } from '../lib/fakultasData';
import { isFirebaseConfigured, fetchUserFromCloudByIdentifier } from '../lib/firebase';
import { Settings } from '../lib/settings';

export default function RegisterAccountWizard({ onSwitchToLogin }) {
  const router = useRouter();
  const isClosed = Settings.isRegistrationClosed();
  const applicantCount = Settings.getApplicantCountDisplay();

  if (isClosed) {
    return (
      <div style={{
        padding: '2rem 1.5rem',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid rgba(196, 158, 89, 0.3)',
        boxShadow: '0 4px 20px rgba(10, 25, 47, 0.06)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'rgba(196, 158, 89, 0.12)',
          color: 'var(--navy)',
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          marginBottom: '1.25rem'
        }}>
          Pendaftaran Resmi Ditutup
        </div>

        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: 'var(--navy)',
          marginBottom: '0.75rem',
          lineHeight: 1.3
        }}>
          Terima Kasih Atas Partisipasi Anda
        </h3>

        <p style={{
          fontSize: '0.88rem',
          color: '#475569',
          lineHeight: 1.6,
          maxWidth: '460px',
          margin: '0 auto 1.25rem'
        }}>
          Masa pendaftaran Pemilihan Duta Kampus UIN Siber Syekh Nurjati Cirebon 2026 telah resmi berakhir. Panitia Pelaksana mengucapkan apresiasi dan terima kasih yang sebesar-besarnya kepada <strong>{applicantCount} pendaftar</strong> yang telah berpartisipasi dan mengirimkan berkas pendaftaran.
        </p>

        <div style={{
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          fontSize: '0.82rem',
          color: '#334155',
          lineHeight: 1.55,
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>
            Informasi Bagi Pendaftar:
          </div>
          Bagi seluruh rekan-rekan pendaftar yang telah memiliki akun, silakan masuk ke portal peserta untuk meninjau kelengkapan berkas Anda serta menantikan pengumuman hasil seleksi administrasi sesuai jadwal resmi.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="btn btn-gold"
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.9rem',
              justifyContent: 'center'
            }}
          >
            Masuk ke Akun Peserta
          </button>
          <a
            href="/"
            style={{
              padding: '0.75rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              color: 'var(--text-mid)',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'block'
            }}
          >
            Kembali ke Halaman Utama
          </a>
        </div>
      </div>
    );
  }

  const [step, setStep] = useState(1); // 1: Informasi Akun, 2: Informasi Pribadi

  // Step 1: Data Akun
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // Step 2: Informasi Pribadi
  const [kewarganegaraan, setKewarganegaraan] = useState('Warga Negara Indonesia (WNI)');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nim, setNim] = useState('');
  const [fakultas, setFakultas] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [semester, setSemester] = useState('4');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Unique IDs for accessibility
  const emailInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();
  const kewarganegaraanSelectId = useId();
  const namaInputId = useId();
  const nimInputId = useId();
  const fakultasSelectId = useId();
  const jurusanSelectId = useId();
  const semesterSelectId = useId();
  const tempatLahirInputId = useId();
  const tanggalLahirInputId = useId();

  // Dynamic majors list based on selected faculty
  const selectedFakultasObj = FAKULTAS_DATA.find((f) => f.name === fakultas);
  const availableJurusan = selectedFakultasObj ? selectedFakultasObj.jurusan : [];

  // Live email validation
  const emailVal = validateEmailFormat(email);
  const isEmailDuplicate = email.trim() && Auth.getUsers().some(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  // Handle Faculty Change
  const handleFakultasChange = (e) => {
    const newFakultas = e.target.value;
    setFakultas(newFakultas);
    setJurusan(''); // Reset major when faculty changes
    if (errors.fakultas) setErrors((prev) => ({ ...prev, fakultas: '' }));
  };

  // Validate Step 1
  const handleNextToStep2 = async (e) => {
    e.preventDefault();
    setEmailTouched(true);
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Alamat email wajib diisi.';
    } else if (!emailVal.isValid) {
      newErrors.email = emailVal.message;
    } else {
      // Re-verify against authoritative server database
      if (isFirebaseConfigured) {
        try {
          const cloudUser = await fetchUserFromCloudByIdentifier(email.trim());
          if (cloudUser && cloudUser.password) {
            newErrors.email = 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
          } else {
            // Not in database or was deleted! Purge stale local copy so re-registration is never blocked
            const cleaned = Auth.getUsers().filter(u => u.email.toLowerCase() !== email.trim().toLowerCase());
            localStorage.setItem('dutauinssc_users', JSON.stringify(cleaned));
            try {
              window.dispatchEvent(new Event('storage'));
              window.dispatchEvent(new CustomEvent('users-updated', { detail: cleaned }));
            } catch (e) {}
          }
        } catch (err) {
          if (isEmailDuplicate) {
            newErrors.email = 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
          }
        }
      } else if (isEmailDuplicate) {
        newErrors.email = 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
      }
    }

    if (!password) {
      newErrors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi wajib diisi.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi kata sandi tidak sesuai dengan kata sandi.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Validate Step 2 and Submit
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!kewarganegaraan) newErrors.kewarganegaraan = 'Pilih status kewarganegaraan.';
    if (!namaLengkap.trim()) newErrors.namaLengkap = 'Nama lengkap wajib diisi.';
    if (!nim.trim()) newErrors.nim = 'NIM wajib diisi.';
    if (!fakultas) newErrors.fakultas = 'Pilih fakultas asal.';
    if (!jurusan) newErrors.jurusan = 'Pilih program studi / jurusan.';
    if (!tempatLahir.trim()) newErrors.tempatLahir = 'Tempat lahir wajib diisi.';
    if (!tanggalLahir) newErrors.tanggalLahir = 'Tanggal lahir wajib diisi.';
    if (!jenisKelamin) newErrors.jenisKelamin = 'Pilih jenis kelamin.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setSubmitting(true);
      try {
        const res = await Auth.registerAccount({
          email,
          password,
          kewarganegaraan,
          namaLengkap,
          nim,
          fakultas,
          jurusan,
          semester: semester || '4',
          tempatLahir,
          tanggalLahir,
          jenisKelamin,
        });

        if (res && res.success) {
          localStorage.setItem('dutauinssc_session_created', Date.now().toString());
          window.location.href = '/profil';
        } else {
          setSubmitting(false);
          setErrors({ general: res?.error || 'Terjadi kesalahan saat mengajukan akun.' });
        }
      } catch (err) {
        console.error('Registration submit error:', err);
        setSubmitting(false);
        setErrors({ general: err.message || 'Terjadi kendala saat menghubungkan ke database server.' });
      }
    }
  };

  return (
    <div className="registration-wizard" style={{ width: '100%' }}>
      {/* 2-Step Progress Indicator */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Formulir Pendaftaran Akun
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-mid)', background: 'var(--bg-alt)', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--border-soft)' }}>
            Langkah {step} dari 2: {step === 1 ? 'Informasi Akun' : 'Informasi Pribadi'}
          </span>
        </div>

        {/* 2-Steps Visual Tracker */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
          <div style={{ 
            background: step === 1 ? 'rgba(196,158,89,0.1)' : 'var(--bg-alt)',
            border: step === 1 ? '1.5px solid var(--gold)' : '1px solid var(--border-soft)',
            borderRadius: '8px', padding: '10px 14px'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: step >= 1 ? 'var(--navy)' : 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Langkah 1
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: step === 1 ? 'var(--navy)' : 'var(--text-mid)', marginTop: '2px' }}>
              Informasi Akun
            </div>
          </div>

          <div style={{ 
            background: step === 2 ? 'rgba(196,158,89,0.1)' : 'var(--bg-alt)',
            border: step === 2 ? '1.5px solid var(--gold)' : '1px solid var(--border-soft)',
            borderRadius: '8px', padding: '10px 14px'
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: step === 2 ? 'var(--navy)' : 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Langkah 2
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: step === 2 ? 'var(--navy)' : 'var(--text-mid)', marginTop: '2px' }}>
              Informasi Pribadi
            </div>
          </div>
        </div>

        {/* Progress Line */}
        <div style={{ width: '100%', height: '4px', background: 'var(--border-soft)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ 
            width: step === 1 ? '50%' : '100%', 
            height: '100%', 
            background: 'var(--gold)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* General Error Notification */}
      {errors.general && (
        <div style={{ 
          backgroundColor: '#fff5f5',
          color: '#991b1b', 
          border: '1px solid #fed7d7',
          borderLeft: '4px solid #dc2626',
          padding: '0.85rem 1.15rem', 
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          fontWeight: 500,
          lineHeight: 1.45,
          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.06)'
        }}>
          {errors.general}
        </div>
      )}

      {/* STEP 1: INFORMASI AKUN */}
      {step === 1 && (
        <form onSubmit={handleNextToStep2} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
              Informasi Akun
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-mid)', margin: '0.25rem 0 0 0' }}>
              Masukkan alamat email aktif dan kata sandi akun pendaftar.
            </p>
          </div>

          {/* Email Field with smart validation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor={emailInputId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                Alamat Email <span style={{ color: '#dc2626' }}>*</span>
              </label>
              {email.trim() && (
                <span style={{ 
                  fontSize: '0.74rem', 
                  fontWeight: 600, 
                  color: isEmailDuplicate ? '#dc2626' : emailVal.isValid ? '#15803d' : '#b45309' 
                }}>
                  {isEmailDuplicate 
                    ? 'Email sudah terdaftar' 
                    : emailVal.isValid 
                    ? 'Format email valid' 
                    : 'Format email tidak valid'}
                </span>
              )}
            </div>
            <input
              id={emailInputId}
              type="email"
              placeholder="Masukkan alamat email aktif"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              onBlur={() => setEmailTouched(true)}
              style={{
                width: '100%',
                padding: '0.8rem 0.95rem',
                borderRadius: '8px',
                border: `1px solid ${errors.email ? '#dc2626' : (emailTouched && email.trim() && emailVal.isValid && !isEmailDuplicate) ? '#15803d' : 'var(--border)'}`,
                background: 'var(--bg)',
                outline: 'none',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
            {errors.email ? (
              <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>{errors.email}</span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                Gunakan alamat email aktif.
              </span>
            )}
          </div>

          {/* Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor={passwordInputId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
              Kata Sandi <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id={passwordInputId}
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                style={{
                  width: '100%',
                  padding: '0.8rem 0.95rem',
                  paddingRight: '5.5rem',
                  borderRadius: '8px',
                  border: `1px solid ${errors.password ? '#dc2626' : 'var(--border)'}`,
                  background: 'var(--bg)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 600
                }}
              >
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            {errors.password && (
              <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>{errors.password}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor={confirmPasswordInputId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                Konfirmasi Kata Sandi <span style={{ color: '#dc2626' }}>*</span>
              </label>
              {confirmPassword && (
                <span style={{ 
                  fontSize: '0.74rem', 
                  fontWeight: 600, 
                  color: password === confirmPassword ? '#15803d' : '#dc2626' 
                }}>
                  {password === confirmPassword ? 'Kata sandi cocok' : 'Belum cocok'}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id={confirmPasswordInputId}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Masukkan ulang kata sandi"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                style={{
                  width: '100%',
                  padding: '0.8rem 0.95rem',
                  paddingRight: '5.5rem',
                  borderRadius: '8px',
                  border: `1px solid ${errors.confirmPassword ? '#dc2626' : (confirmPassword && password === confirmPassword) ? '#15803d' : 'var(--border)'}`,
                  background: 'var(--bg)',
                  outline: 'none',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-mid)', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 600
                }}
              >
                {showConfirmPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
            {errors.confirmPassword && (
              <span style={{ fontSize: '0.78rem', color: '#dc2626' }}>{errors.confirmPassword}</span>
            )}
          </div>

          {/* Action Button: Next to Step 2 */}
          <button
            type="submit"
            className="btn btn-gold"
            style={{
              width: '100%',
              marginTop: '0.5rem',
              borderRadius: '8px',
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            Lanjut ke Informasi Pribadi
          </button>
        </form>
      )}

      {/* STEP 2: INFORMASI PRIBADI */}
      {step === 2 && (
        <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
              Informasi Pribadi
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-mid)', margin: '0.25rem 0 0 0' }}>
              Lengkapi data identitas calon pendaftar sesuai dengan data akademik.
            </p>
          </div>

          {/* Kewarganegaraan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor={kewarganegaraanSelectId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
              Kewarganegaraan <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id={kewarganegaraanSelectId}
              value={kewarganegaraan}
              onChange={(e) => setKewarganegaraan(e.target.value)}
              style={{
                width: '100%', padding: '0.8rem 0.95rem', borderRadius: '8px',
                border: '1px solid var(--border)', background: 'var(--bg)',
                outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit',
                cursor: 'pointer', boxSizing: 'border-box'
              }}
            >
              {KEWARGANEGARAAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Nama Lengkap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor={namaInputId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
              Nama Lengkap <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id={namaInputId}
              type="text"
              placeholder="Masukkan nama lengkap sesuai identitas"
              value={namaLengkap}
              onChange={(e) => {
                setNamaLengkap(e.target.value);
                if (errors.namaLengkap) setErrors((prev) => ({ ...prev, namaLengkap: '' }));
              }}
              style={{
                width: '100%', padding: '0.8rem 0.95rem', borderRadius: '8px',
                border: `1px solid ${errors.namaLengkap ? '#dc2626' : 'var(--border)'}`,
                background: 'var(--bg)', outline: 'none', fontSize: '0.9rem',
                fontFamily: 'inherit', boxSizing: 'border-box'
              }}
            />
            {errors.namaLengkap && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{errors.namaLengkap}</span>}
          </div>

          {/* NIM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor={nimInputId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
              Nomor Induk Mahasiswa (NIM) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id={nimInputId}
              type="text"
              placeholder="Nomor Induk Mahasiswa"
              value={nim}
              onChange={(e) => {
                setNim(e.target.value);
                if (errors.nim) setErrors((prev) => ({ ...prev, nim: '' }));
              }}
              style={{
                width: '100%', padding: '0.8rem 0.95rem', borderRadius: '8px',
                border: `1px solid ${errors.nim ? '#dc2626' : 'var(--border)'}`,
                background: 'var(--bg)', outline: 'none', fontSize: '0.9rem',
                fontFamily: 'inherit', boxSizing: 'border-box'
              }}
            />
            {errors.nim && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{errors.nim}</span>}
          </div>

          {/* Fakultas Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor={fakultasSelectId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
              Fakultas <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id={fakultasSelectId}
              value={fakultas}
              onChange={handleFakultasChange}
              style={{
                width: '100%', padding: '0.8rem 0.95rem', borderRadius: '8px',
                border: `1px solid ${errors.fakultas ? '#dc2626' : 'var(--border)'}`,
                background: 'var(--bg)', outline: 'none', fontSize: '0.9rem',
                fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box'
              }}
            >
              <option value="">Pilih Fakultas</option>
              {FAKULTAS_DATA.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name} ({f.shortName})
                </option>
              ))}
            </select>
            {errors.fakultas && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{errors.fakultas}</span>}
          </div>

          {/* Jurusan / Program Studi Dropdown (Dinamis sesuai fakultas) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor={jurusanSelectId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
              Program Studi / Jurusan <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id={jurusanSelectId}
              value={jurusan}
              onChange={(e) => {
                setJurusan(e.target.value);
                if (errors.jurusan) setErrors((prev) => ({ ...prev, jurusan: '' }));
              }}
              disabled={!fakultas}
              style={{
                width: '100%', padding: '0.8rem 0.95rem', borderRadius: '8px',
                border: `1px solid ${errors.jurusan ? '#dc2626' : 'var(--border)'}`,
                background: !fakultas ? '#f3f4f6' : 'var(--bg)',
                outline: 'none', fontSize: '0.9rem', fontFamily: 'inherit',
                cursor: !fakultas ? 'not-allowed' : 'pointer', boxSizing: 'border-box'
              }}
            >
              {!fakultas ? (
                <option value="">Pilih Fakultas terlebih dahulu</option>
              ) : (
                <>
                  <option value="">Pilih Program Studi</option>
                  {availableJurusan.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </>
              )}
            </select>
            {errors.jurusan && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{errors.jurusan}</span>}
          </div>

          {/* Semester Saat Ini */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label htmlFor={semesterSelectId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
              Semester Saat Ini <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              id={semesterSelectId}
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                if (errors.semester) setErrors((prev) => ({ ...prev, semester: '' }));
              }}
              style={{
                width: '100%', padding: '0.8rem 0.95rem', borderRadius: '8px',
                border: `1px solid ${errors.semester ? '#dc2626' : 'var(--border)'}`,
                background: 'var(--bg)', outline: 'none', fontSize: '0.9rem',
                fontFamily: 'inherit', cursor: 'pointer', boxSizing: 'border-box'
              }}
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
            {errors.semester && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{errors.semester}</span>}
          </div>

          {/* Tempat Lahir & Tanggal Lahir in 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label htmlFor={tempatLahirInputId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                Tempat Lahir <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id={tempatLahirInputId}
                type="text"
                placeholder="Masukkan tempat / kota lahir"
                value={tempatLahir}
                onChange={(e) => {
                  setTempatLahir(e.target.value);
                  if (errors.tempatLahir) setErrors((prev) => ({ ...prev, tempatLahir: '' }));
                }}
                style={{
                  width: '100%', padding: '0.8rem 0.95rem', borderRadius: '8px',
                  border: `1px solid ${errors.tempatLahir ? '#dc2626' : 'var(--border)'}`,
                  background: 'var(--bg)', outline: 'none', fontSize: '0.9rem',
                  fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
              {errors.tempatLahir && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{errors.tempatLahir}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label htmlFor={tanggalLahirInputId} style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
                Tanggal Lahir <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                id={tanggalLahirInputId}
                type="date"
                value={tanggalLahir}
                onChange={(e) => {
                  setTanggalLahir(e.target.value);
                  if (errors.tanggalLahir) setErrors((prev) => ({ ...prev, tanggalLahir: '' }));
                }}
                style={{
                  width: '100%', padding: '0.8rem 0.95rem', borderRadius: '8px',
                  border: `1px solid ${errors.tanggalLahir ? '#dc2626' : 'var(--border)'}`,
                  background: 'var(--bg)', outline: 'none', fontSize: '0.9rem',
                  fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
              {errors.tanggalLahir && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{errors.tanggalLahir}</span>}
            </div>
          </div>

          {/* Jenis Kelamin */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>
              Jenis Kelamin <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem', borderRadius: '8px',
                border: `1px solid ${jenisKelamin === 'Laki-laki' ? 'var(--gold)' : 'var(--border)'}`,
                background: jenisKelamin === 'Laki-laki' ? 'rgba(196,158,89,0.06)' : 'var(--bg)',
                cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500
              }}>
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="Laki-laki"
                  checked={jenisKelamin === 'Laki-laki'}
                  onChange={() => setJenisKelamin('Laki-laki')}
                  style={{ accentColor: 'var(--gold)' }}
                />
                Laki-laki
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1rem', borderRadius: '8px',
                border: `1px solid ${jenisKelamin === 'Perempuan' ? 'var(--gold)' : 'var(--border)'}`,
                background: jenisKelamin === 'Perempuan' ? 'rgba(196,158,89,0.06)' : 'var(--bg)',
                cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500
              }}>
                <input
                  type="radio"
                  name="jenisKelamin"
                  value="Perempuan"
                  checked={jenisKelamin === 'Perempuan'}
                  onChange={() => setJenisKelamin('Perempuan')}
                  style={{ accentColor: 'var(--gold)' }}
                />
                Perempuan
              </label>
            </div>
          </div>

          {/* Navigation Buttons: Back & Ajukan Akun */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-outline-gold"
              style={{
                flex: 1, borderRadius: '8px', padding: '0.85rem',
                fontSize: '0.9rem', fontWeight: 600
              }}
            >
              Kembali
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-gold"
              style={{
                flex: 2, borderRadius: '8px', padding: '0.85rem',
                fontSize: '0.95rem', fontWeight: 600,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Memproses Pendaftaran...' : 'Daftar & Masuk ke Dashboard'}
            </button>
          </div>
        </form>
      )}

      {/* Switch to Login Link */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-mid)' }}>
        Sudah memiliki akun?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{
            background: 'none', border: 'none', color: 'var(--gold)',
            fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '0.85rem',
            textDecoration: 'underline'
          }}
        >
          Masuk di sini
        </button>
      </div>
    </div>
  );
}
