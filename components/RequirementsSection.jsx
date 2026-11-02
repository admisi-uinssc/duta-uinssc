'use client';

import Link from './Link';

export default function RequirementsSection() {
  const generalCriteria = [
    'Mahasiswa aktif UIN Siber Syekh Nurjati Cirebon semester 1–5.',
    'Terbuka bagi mahasiswa dari seluruh program studi dan fakultas.',
    'Memiliki integritas, etika islami, dan komitmen menjaga nama baik almamater.',
    'Memiliki minat dalam public speaking, promosi multimedia, dan kehumasan.',
    'Bersedia mengikuti seluruh tahapan seleksi dan rangkaian karantina hingga pengukuhan.',
    'Tidak sedang menerima sanksi akademik atau indisipliner.'
  ];

  const documentList = [
    { title: 'Surat Pernyataan Bersedia Mengikuti Peraturan', req: true, note: 'Bermaterai, format resmi panitia' },
    { title: 'Curriculum Vitae (CV)', req: true, note: 'Format ATS atau kreatif' },
    { title: 'Surat Rekomendasi Resmi', req: true, note: 'Dikeluarkan oleh HMPS / Jurusan / Fakultas' },
    { title: 'Sertifikat Prestasi Akademik / Non-Akademik', req: false, note: 'Tingkat regional/nasional/internasional 3 tahun terakhir' },
    { title: 'Paket Foto Formal Mahasiswa', req: true, note: 'Full badan, setengah badan, & close up 3x4 (pakaian hitam putih)' },
    { title: 'Motivation Letter', req: true, note: 'Gagasan kontribusi, komitmen, & visi misi' },
    { title: 'Bukti Follow Media Sosial Resmi', req: true, note: 'Follow Instagram @duta_uinssc, @admisi.uinssc, & @uinsscofficial' },
    { title: 'Kartu Tanda Mahasiswa (KTM)', req: true, note: 'Scan KTM aktif atau surat keterangan aktif' },
    { title: 'Transkrip Nilai / KHS Kumulatif', req: true, note: 'KHS semester terakhir yang disahkan' },
    { title: 'Bukti Diterima di UINSSC', req: false, note: 'Khusus bagi mahasiswa baru semester 1' },
  ];

  return (
    <section className="section-pad bg-alt" id="requirements">
      <div className="container">
        <div className="section-header text-center" style={{ maxWidth: '720px', margin: '0 auto 2.5rem' }}>
          <h2 className="heading-lg">Persyaratan <span>Pendaftaran</span></h2>
          <p className="lead">
            Pastikan Anda memenuhi ketentuan kriteria umum dan melengkapi 10 berkas administrasi sebelum mengajukan akun dan dokumen pendaftaran.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          {/* KRITERIA UMUM */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold)' }} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>Kriteria Umum Peserta</h3>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {generalCriteria.map((crit, i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12" /></svg>
                  <span>{crit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 10 BERKAS DOKUMEN */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--navy)' }} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>10 Berkas Dokumen Persyaratan</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {documentList.map((doc, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', padding: '0.6rem 0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--navy)' }}>
                      {i + 1}. {doc.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      {doc.note}
                    </div>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: doc.req ? '#dcfce7' : '#f1f5f9',
                      color: doc.req ? '#166534' : '#64748b'
                    }}
                  >
                    {doc.req ? 'Wajib' : 'Tidak Wajib'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="req-cta text-center" style={{ background: 'var(--navy)', color: '#fff', borderRadius: '16px', padding: '2.5rem 2rem', maxWidth: '780px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>Siap Menjadi Representasi Mahasiswa Unggul?</h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Siapkan seluruh dokumen persyaratan Anda dan daftarkan diri pada Pemilihan Duta Kampus 2026.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-gold btn-lg" style={{ padding: '0.85rem 2.25rem', fontWeight: 700 }}>
              Ajukan Akun & Mulai Pendaftaran
            </Link>
            <a 
              href="https://drive.google.com/drive/folders/1WQUTBWazFp6GbT4r4wjIKTD6HNGKrgoH" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-outline-white btn-lg" 
              style={{ padding: '0.85rem 1.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Unduh Booklet
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
