import React, { useState, useEffect } from 'react';
import Link from './Link';
import Image from './Image';
import { CMS } from '../lib/cms';
import { parseMediaUrl } from '../lib/media';

export default function AboutSection() {
  const [aboutData, setAboutData] = useState(() => CMS.get().about || {});

  useEffect(() => {
    setAboutData(CMS.get().about || {});
    
    CMS.getAsync().then((data) => {
      if (data?.about) {
        setAboutData(data.about);
      }
    }).catch(() => {});

    const unsubscribe = CMS.subscribe((data) => {
      if (data && data.about) {
        setAboutData(data.about);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const orgStructure = {
    executive: [
      { role: 'Ketua Umum', name: 'Muhammad Rizki Fadlillah' },
      { role: 'Wakil Ketua', name: 'Mitsni Uswatun Hasanah' },
    ],
    admin: [
      { role: 'Sekretaris 1', name: 'Rasikin' },
      { role: 'Sekretaris 2', name: 'Sahla Aina Muflihah' },
      { role: 'Bendahara Umum', name: 'Berliana Nabila Az-Zahra' },
    ],
    divisions: [
      {
        name: 'Public Relation (Humas)',
        members: ['Muhammad Irfan Maulana', 'Nadia Salma', 'Muhammad Danu Arrahman', 'Tonisah']
      },
      {
        name: 'Media Informasi Jurnalistik (MIJ)',
        members: [
          'Yudi Prasetya',
          'Agus Haerul',
          'Amelia Agustina',
          'Mohammad Ade Rifki',
          'Muhamad Syihabudin Anam',
          'Zahra Roudhotun Najah',
          'Mardiya Ghorizadin'
        ]
      },
      {
        name: 'Content Planner',
        members: ['Moja Yulia Paramita', 'Dhiya Ghisya Aulia', 'Syahdan Noer Saputra', 'Khoridatus Shofa']
      }
    ]
  };

  const parsedVisual = parseMediaUrl(aboutData.img, aboutData.mediaType);

  return (
    <section className="section-pad" id="about">
      <div className="container">
        {/* PENGENALAN PROGRAM */}
        <div className="about-grid" style={{ alignItems: 'center', marginBottom: '4.5rem' }}>
          <div className="about-visual">
            <div 
              className="about-img-wrap" 
              style={{ 
                borderRadius: '16px', 
                overflow: 'hidden', 
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)', 
                position: 'relative'
              }}
            >
              {parsedVisual.isVideo ? (
                parsedVisual.source === 'youtube' ? (
                  <iframe
                    src={parsedVisual.autoplayEmbedUrl || `https://www.youtube-nocookie.com/embed/${parsedVisual.videoId}?autoplay=1&mute=1&loop=1&playlist=${parsedVisual.videoId}&controls=0&showinfo=0&rel=0&playsinline=1`}
                    title="Video Program"
                    style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
                    allow="autoplay; encrypted-media"
                  />
                ) : parsedVisual.source === 'drive' ? (
                  <iframe
                    src={parsedVisual.autoplayEmbedUrl || `https://drive.google.com/file/d/${parsedVisual.videoId}/preview`}
                    title="Video Program"
                    style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', inset: 0 }}
                    allow="autoplay"
                  />
                ) : (
                  <video
                    src={parsedVisual.directVideoUrl || aboutData.img}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                  />
                )
              ) : (
                <Image
                  src={aboutData.img || 'https://ppid.uinssc.ac.id/storage/duta-kampus/01KRX8ZRGXBTT2929HWZQ7CWMM.png'}
                  alt="Program Duta Kampus UIN SSC"
                  loading="lazy"
                  fill
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  fallbackSrc="https://ppid.uinssc.ac.id/storage/duta-kampus/01KRX8ZRGXBTT2929HWZQ7CWMM.png"
                />
              )}

              <div className="about-img-accent" style={{ background: 'var(--navy)', color: '#fff', padding: '12px 18px', borderRadius: '10px', zIndex: 2 }}>
                <strong style={{ color: 'var(--gold)' }}>{aboutData.badgeYear || '2026'}</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{aboutData.badgeText || 'Pemilihan Resmi'}</span>
              </div>
            </div>
          </div>

          <div className="about-content">
            <div className="section-header">
              <h2 className="heading-lg" style={{ color: 'var(--navy)', marginTop: '0.25rem', marginBottom: '1.25rem' }}>
                Program <span>Duta Kampus</span>
              </h2>
              <p className="lead" style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-dark)' }}>
                {aboutData.desc || 'Melakukan Expo & Sosialisasi ke sekolah-sekolah se-Ciayumajakuning bahkan lebih tentang UIN Siber Syekh Nurjati Cirebon, melakukan promosi dalam bentuk video atau flyer melalui laman Instagram UPT Admisi dan Promosi, pelayanan Admisi untuk mensosialisasi calon mahasiswa baru UIN Siber Syekh Nurjati Cirebon selama periode SPAN-PTKIN sampai SPMB MANDIRI, serta mengayomi Paguyuban Duta dalam lingkungan UIN Siber Syekh Nurjati Cirebon.'}
              </p>
            </div>

            <div className="about-points" style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="about-point" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '4px', height: '42px', background: 'var(--gold)', borderRadius: '2px', flexShrink: 0 }} />
                <div className="about-point-text">
                  <strong style={{ color: 'var(--navy)', fontSize: '0.95rem' }}>{aboutData.point1Title || 'Sosialisasi & Edukasi Calon Mahasiswa'}</strong>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.5 }}>
                    {aboutData.point1Desc || 'Mendampingi calon mahasiswa baru dari seleksi SPAN-PTKIN, UM-PTKIN, hingga SPMB Mandiri.'}
                  </p>
                </div>
              </div>

              <div className="about-point" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '4px', height: '42px', background: 'var(--navy)', borderRadius: '2px', flexShrink: 0 }} />
                <div className="about-point-text">
                  <strong style={{ color: 'var(--navy)', fontSize: '0.95rem' }}>{aboutData.point2Title || 'Duta Promosi Multimedia & Humas'}</strong>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-mid)', lineHeight: 1.5 }}>
                    {aboutData.point2Desc || 'Menghadirkan konten kreatif flyer, video promosi, dan aktivasi media sosial institusi.'}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <Link href={aboutData.btnLink || '/login'} className="btn btn-gold" style={{ padding: '0.85rem 2rem', fontWeight: 600 }}>
                {aboutData.btnText || 'Ajukan Akun & Mulai Pendaftaran'}
              </Link>
            </div>
          </div>
        </div>

        {/* STRUKTUR ORGANISASI PAGUYUBAN DUTA KAMPUS */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem 2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div className="section-header text-center" style={{ maxWidth: '640px', margin: '0 auto 2rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Kepengurusan Resmi
            </span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)', margin: '0.25rem 0 0.5rem' }}>
              Struktur Organisasi Paguyuban Duta Kampus
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
              Jajaran pengurus yang menggerakkan program kerja dan representasi mahasiswa UIN Siber Syekh Nurjati Cirebon.
            </p>
          </div>

          {/* KETUA & WAKIL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', maxWidth: '640px', margin: '0 auto 1.5rem' }}>
            {orgStructure.executive.map((item, i) => (
              <div key={i} style={{ background: 'var(--navy)', color: '#fff', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', border: '1px solid rgba(196,158,89,0.3)' }}>
                <span style={{ display: 'inline-block', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {item.role}
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.name}</div>
              </div>
            ))}
          </div>

          {/* SEKRETARIS & BENDAHARA */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: '820px', margin: '0 auto 2rem' }}>
            {orgStructure.admin.map((item, i) => (
              <div key={i} style={{ background: 'var(--bg-alt)', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {item.role}
                </span>
                <div style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--navy)' }}>{item.name}</div>
              </div>
            ))}
          </div>

          {/* DIVISI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {orgStructure.divisions.map((div, i) => (
              <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)' }} />
                  <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: 'var(--navy)' }}>{div.name}</h4>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {div.members.map((m, mi) => (
                    <li key={mi} style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
