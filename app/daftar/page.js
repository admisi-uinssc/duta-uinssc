'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DB } from '../../lib/db';
import { Settings } from '../../lib/settings';
import { Auth } from '../../lib/auth';

const Field = ({ id, label, required, error, children }) => (
  <div className={`form-group ${id === 'alamat' ? 'full' : ''}`}>
    <label htmlFor={id}>{label} {required && <span className="required">*</span>}</label>
    {children}
    {error && <span className="field-error show">{error}</span>}
  </div>
);

export default function DaftarPage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    namaLengkap: '', nim: '', prodi: '', semester: '',
    jenisKelamin: '', ttl: '', noHp: '', email: '',
    alamat: '', tinggiBadan: '', instagram: '',
    ipk: '', statusMahasiswa: '', prestasi: '',
    organisasi: '', motivasi: '', visi: '', bakatKemampuan: ''
  });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [motivasiWords, setMotivasiWords] = useState(0);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    setOpen(Settings.isPendaftaranOpen());
    const user = Auth.getCurrentUser();
    if (!user) {
      router.push('/login');
    } else {
      router.push('/profil');
    }
  }, [router]);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const inputProps = (k) => ({ value: data[k], onChange: e => set(k, e.target.value), className: errors[k] ? 'error' : '' });

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

  const nextStep = () => { if (validateStep(step)) { window.scrollTo({ top: 0, behavior: 'smooth' }); setStep(s => s + 1); } };
  const prevStep = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setStep(s => s - 1); };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Ukuran foto maksimal 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPhoto(ev.target.result); setErrors(err => ({ ...err, foto: null })); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;
    if (!agreed) { alert('Anda harus menyetujui pernyataan komitmen'); return; }
    
    DB.insert({ ...data, foto: photo });
    
    const user = Auth.getCurrentUser();
    if (user) {
      Auth.updateStatus(user.email, 'Sedang Diverifikasi');
    }
    
    window.location.href = '/profil';
  };

  if (!open) {
    return (
      <main className="form-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-alt)' }}>
        <div className="closed-notice">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#dc2626' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <h2>Pendaftaran Ditutup</h2>
          <p>Mohon maaf, periode pendaftaran Duta Kampus saat ini sedang tidak dibuka atau sudah berakhir.</p>
          <Link href="/" className="btn btn-navy btn-lg" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>Kembali ke Beranda</Link>
        </div>
      </main>
    );
  }


  return (
    <>
      <main className="form-page container">
        <div className="form-wrapper">
          <div className="form-header">
            <div className="form-header-bg"></div>
            <div className="form-header-content">
              <Link href="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Image src="/assets/logo-circle.png" alt="Logo" width={40} height={40} />
                <div className="nav-logo-text" style={{ color: '#fff' }}><span className="nav-logo-title" style={{ color: '#fff' }}>Duta Kampus</span><span className="nav-logo-sub" style={{ color: 'rgba(255,255,255,0.7)' }}>Pendaftaran 2026</span></div>
              </Link>
              <Link href="/" className="back-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Tutup Form
              </Link>
            </div>
          </div>

          <div className="step-progress">
            {[ { n: 1, l: 'Informasi Pribadi' }, { n: 2, l: 'Akademik & Motivasi' }, { n: 3, l: 'Unggah & Konfirmasi' } ].map(s => (
              <div key={s.n} className={`step-item ${step === s.n ? 'active' : ''} ${step > s.n ? 'done' : ''}`}>
                <div className="step-circle">{s.n}</div>
                <span className="step-label">{s.l}</span>
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="form-step active">
              <div className="step-title"><span className="step-num">01</span><div><h2>Informasi Pribadi</h2><p>Lengkapi data diri dasar Anda.</p></div></div>
              <div className="form-grid">
                <Field id="namaLengkap" label="Nama Lengkap" required error={errors.namaLengkap}>
                  <input id="namaLengkap" type="text" placeholder="Sesuai KTP/KTM" {...inputProps('namaLengkap')} />
                </Field>
                <Field id="nim" label="NIM" required error={errors.nim}>
                  <input id="nim" type="text" placeholder="Nomor Induk Mahasiswa" {...inputProps('nim')} />
                </Field>
                <Field id="prodi" label="Program Studi" required error={errors.prodi}>
                  <input id="prodi" type="text" placeholder="Contoh: PJJ PAI" {...inputProps('prodi')} />
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
                <Field id="alamat" label="Alamat Lengkap" required error={errors.alamat}>
                  <textarea id="alamat" rows={3} placeholder="Alamat domisili saat ini" {...inputProps('alamat')} />
                </Field>
                <Field id="tinggiBadan" label="Tinggi Badan (cm)" error={errors.tinggiBadan}>
                  <input id="tinggiBadan" type="number" min={100} max={250} placeholder="165" {...inputProps('tinggiBadan')} />
                </Field>
                <Field id="instagram" label="Username Instagram" error={errors.instagram}>
                  <input id="instagram" type="text" placeholder="@username" {...inputProps('instagram')} />
                </Field>
              </div>
              <div className="form-actions"><span /><button type="button" className="btn btn-gold btn-lg" onClick={nextStep}>Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button></div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="form-step active">
              <div className="step-title"><span className="step-num">02</span><div><h2>Akademik & Motivasi</h2><p>Ceritakan rekam jejak akademik dan alasan Anda mendaftar.</p></div></div>
              <div className="form-grid">
                <Field id="ipk" label="Indeks Prestasi Kumulatif (IPK)" required error={errors.ipk}>
                  <input id="ipk" type="number" step="0.01" min={0} max={4} placeholder="3.00 – 4.00" {...inputProps('ipk')} />
                </Field>
                <Field id="statusMahasiswa" label="Status Mahasiswa" error={errors.statusMahasiswa}>
                  <select id="statusMahasiswa" {...inputProps('statusMahasiswa')}>
                    <option value="">Pilih status</option>
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
                  <textarea id="motivasi" rows={6} placeholder="Jelaskan alasan Anda mendaftar (minimal 100 kata)" value={data.motivasi} onChange={e => { set('motivasi', e.target.value); setMotivasiWords(e.target.value.trim().split(/\s+/).filter(Boolean).length); }} className={errors.motivasi ? 'error' : ''} />
                  <span className="field-hint" style={{ color: motivasiWords >= 100 ? 'var(--gold-dark)' : undefined }}>{motivasiWords} kata (minimal 100)</span>
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
                <button type="button" className="btn btn-outline-gold btn-lg" onClick={prevStep}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg> Kembali</button>
                <button type="button" className="btn btn-gold btn-lg" onClick={nextStep}>Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="form-step active">
              <div className="step-title"><span className="step-num">03</span><div><h2>Unggah & Konfirmasi</h2><p>Unggah foto profil dan periksa kembali data Anda.</p></div></div>

              <div className="upload-section">
                <label className="upload-label">Pas Foto Profil <span className="required">*</span></label>
                <div className="upload-area" onClick={() => document.getElementById('fotoInput').click()}>
                  <div className="upload-preview-wrap">
                    {photo ? <img src={photo} alt="Preview" className="photo-preview" /> : (
                      <div className="upload-placeholder">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        <p>Klik untuk mengunggah foto</p>
                        <span>JPG atau PNG, maksimal 2 MB</span>
                      </div>
                    )}
                  </div>
                </div>
                <input id="fotoInput" type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handlePhoto} />
                {errors.foto && <span className="field-error show">{errors.foto}</span>}
              </div>

              <div className="review-section">
                <p className="review-title">Ringkasan Pendaftaran</p>
                <div className="review-grid">
                  {[['Nama Lengkap', data.namaLengkap, true],['NIM', data.nim],['Jenis Kelamin', data.jenisKelamin === 'L' ? 'Laki-laki' : data.jenisKelamin === 'P' ? 'Perempuan' : ''],['Program Studi', data.prodi],['Semester', data.semester],['Tanggal Lahir', data.ttl],['No HP', data.noHp],['Email', data.email],['Tinggi Badan', data.tinggiBadan ? data.tinggiBadan + ' cm' : ''],['IPK', data.ipk],['Alamat Lengkap', data.alamat, true]].map(([label, value, full]) => (
                    <div key={label} className={`review-item ${full ? 'full' : ''}`}>
                      <div className="review-item-label">{label}</div>
                      <div className="review-item-value">{value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="declaration-box">
                <h4>Pernyataan Komitmen</h4>
                <p>Dengan mengirimkan formulir ini, saya menyatakan bahwa:</p>
                <ul>
                  <li>Seluruh informasi yang diberikan adalah benar sesuai kemampuan terbaik saya.</li>
                  <li>Saya bersedia mengikuti seluruh rangkaian proses seleksi.</li>
                  <li>Jika terpilih, saya berkomitmen menjalankan tugas sebagai Duta Kampus dengan penuh tanggung jawab.</li>
                  <li>Saya akan senantiasa menjaga nama baik UIN Siber Syekh Nurjati Cirebon.</li>
                </ul>
                <label className="checkbox-label">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ display: 'none' }} />
                  <span className="checkbox-custom"></span>
                  <span>Saya telah membaca dan menyetujui pernyataan di atas.</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline-gold btn-lg" onClick={prevStep}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg> Kembali</button>
                <button type="button" className="btn btn-gold btn-lg" onClick={handleSubmit} disabled={!agreed} style={{ opacity: agreed ? 1 : 0.4, cursor: agreed ? 'pointer' : 'not-allowed' }}>Kirim Pendaftaran</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
