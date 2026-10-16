'use client';

import { useState } from 'react';

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const items = [
    {
      q: 'Apa itu Duta Kampus UIN Siber Syekh Nurjati Cirebon?',
      a: 'Duta Kampus merupakan wadah bagi mahasiswa untuk menjadi representasi UIN Siber Syekh Nurjati Cirebon dalam kegiatan promosi, sosialisasi, pelayanan admisi, serta berbagai kegiatan kampus.'
    },
    {
      q: 'Siapa yang dapat mengikuti Pemilihan Duta Kampus?',
      a: 'Mahasiswa aktif UIN Siber Syekh Nurjati Cirebon semester 1–5 yang memenuhi persyaratan pendaftaran.'
    },
    {
      q: 'Apakah mahasiswa dari semua program studi dapat mendaftar?',
      a: 'Ya, mahasiswa dari berbagai program studi di lingkungan UIN Siber Syekh Nurjati Cirebon dapat mengikuti pemilihan selama memenuhi persyaratan yang telah ditentukan.'
    },
    {
      q: 'Apakah harus memiliki pengalaman organisasi atau prestasi?',
      a: 'Tidak harus. Pengalaman organisasi dan prestasi dapat menjadi nilai tambah, tetapi peserta tetap akan mengikuti seluruh tahapan seleksi sesuai ketentuan panitia.'
    },
    {
      q: 'Apa saja tahapan Pemilihan Duta Kampus 2026?',
      a: 'Tahapan meliputi pendaftaran, technical meeting, seleksi tahap 1 (wawancara), seleksi tahap 2 (unjuk bakat), pengukuhan, pra-karantina, karantina, dan grand final.'
    },
    {
      q: 'Apa yang perlu dipersiapkan untuk mengikuti seleksi?',
      a: 'Peserta perlu mempersiapkan dokumen administrasi, CV, surat rekomendasi, serta mempersiapkan kemampuan komunikasi, wawasan, dan potensi diri sesuai tahapan seleksi.'
    },
    {
      q: 'Apakah wajib memiliki kemampuan public speaking yang baik?',
      a: 'Kemampuan public speaking menjadi salah satu kemampuan yang akan dikembangkan dan digunakan dalam menjalankan tugas sebagai Duta Kampus. Peserta tetap dapat mengikuti seleksi dengan terus mengembangkan kemampuan tersebut.'
    },
    {
      q: 'Apa saja tugas Duta Kampus setelah terpilih?',
      a: 'Duta Kampus berperan dalam expo dan sosialisasi ke sekolah, promosi melalui media sosial, membantu pelayanan admisi selama periode penerimaan mahasiswa baru, serta mengayomi Paguyuban Duta Kampus UIN Siber Syekh Nurjati Cirebon.'
    },
    {
      q: 'Apakah Duta Kampus mendapatkan kegiatan di luar kampus?',
      a: 'Ya. Salah satu program Duta Kampus adalah mengikuti kegiatan expo dan sosialisasi ke sekolah-sekolah di wilayah Ciayumajakuning dan wilayah lainnya sesuai kebutuhan promosi kampus.'
    },
    {
      q: 'Apa manfaat menjadi Duta Kampus?',
      a: 'Peserta dapat mengembangkan public speaking, memperluas relasi, meningkatkan CV dan portofolio, memperoleh pengalaman dalam strategi promosi dan komunikasi, serta berkesempatan mendapatkan rekognisi kegiatan sebagai bagian dari KKN sesuai ketentuan yang berlaku.'
    },
    {
      q: 'Apakah Duta Kampus mendapatkan sertifikat?',
      a: 'Informasi mengenai sertifikat atau bentuk apresiasi lainnya akan disampaikan oleh panitia sesuai ketentuan Pemilihan Duta Kampus 2026.'
    },
    {
      q: 'Di mana saya bisa mendapatkan informasi lengkap mengenai persyaratan?',
      a: 'Informasi lengkap mengenai persyaratan, ketentuan, dan mekanisme pendaftaran dapat dilihat pada Booklet Pemilihan Duta Kampus UIN Siber Syekh Nurjati Cirebon 2026 dan menu Persyaratan di website ini.'
    },
    {
      q: 'Bagaimana jika saya memiliki pertanyaan yang belum tersedia di FAQ?',
      a: 'Silakan menghubungi narahubung resmi Pemilihan Duta Kampus 2026 melalui kontak yang tercantum pada halaman informasi dan media sosial resmi panitia @dutakampusuinssc.'
    }
  ];

  const filteredItems = searchTerm.trim() === ''
    ? items
    : items.filter(
        i =>
          i.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.a.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <section className="section-pad" id="faq" style={{ background: 'var(--bg-alt)' }}>
      <div className="container">
        <div className="section-header text-center" style={{ maxWidth: '720px', margin: '0 auto 2.5rem' }}>
          <h2 className="heading-lg">Tanya Jawab <span>(FAQ)</span></h2>
          <p className="lead">
            Temukan jawaban lengkap atas pertanyaan yang sering diajukan seputar Pemilihan Duta Kampus UIN SSC 2026.
          </p>
          
          <div style={{ marginTop: '1.5rem', position: 'relative', maxWidth: '480px', margin: '1.5rem auto 0' }}>
            <input
              type="text"
              placeholder="Cari pertanyaan seputar pendaftaran, tahapan, tugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem 0.85rem 2.75rem',
                borderRadius: '9999px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                boxSizing: 'border-box'
              }}
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div className="faq-wrap" style={{ maxWidth: '880px', margin: '0 auto' }}>
          {filteredItems.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', width: '100%' }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.975rem' }}>{item.q}</span>
                  <span
                    className="faq-icon"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isOpen ? 'var(--gold)' : '#f1f5f9',
                      color: isOpen ? '#ffffff' : '#64748b',
                      transition: 'all 0.25s',
                      flexShrink: 0,
                      marginLeft: '1rem'
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>
                {isOpen && (
                  <div className="faq-answer" style={{ padding: '0.75rem 1.25rem 1.25rem', color: '#475569', fontSize: '0.925rem', lineHeight: 1.65 }}>
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
              Tidak ditemukan pertanyaan yang cocok dengan pencarian &ldquo;{searchTerm}&rdquo;.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
