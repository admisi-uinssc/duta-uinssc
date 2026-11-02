import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from '../components/Link';
import { CMS } from '../lib/cms';
import { Auth } from '../lib/auth';

export default function PengumumanPage() {
  const [cmsData, setCmsData] = useState(CMS.get());
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(Auth.getCurrentUser());
    const unsub = CMS.subscribe((data) => {
      if (data) setCmsData(data);
    });
    return () => unsub();
  }, []);

  const announcements = (cmsData?.announcements || []).filter(a => a.active !== false);
  const contacts = cmsData?.contacts || {
    whatsapp: '0851-2292-7628',
    whatsappUrl: 'https://wa.me/6285122927628',
    instagram: '@duta_uinssc',
    instagramUrl: 'https://www.instagram.com/duta_uinssc',
    tiktok: '@duta.uin.ssc',
    tiktokUrl: 'https://www.tiktok.com/@duta.uin.ssc',
    email: 'dutakampus@uinssc.ac.id'
  };

  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ minHeight: '80vh', background: 'var(--bg-alt)', paddingTop: '90px', paddingBottom: '4rem' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ 
              display: 'inline-block',
              padding: '6px 16px', 
              borderRadius: '999px', 
              fontSize: '0.8rem', 
              fontWeight: 800, 
              letterSpacing: '1px',
              textTransform: 'uppercase',
              background: 'rgba(196, 158, 89, 0.15)', 
              color: 'var(--gold)',
              marginBottom: '1rem'
            }}>
              Pusat Informasi Resmi
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 1rem 0', lineHeight: 1.2 }}>
              Pengumuman & Agenda Seleksi
            </h1>
            <p style={{ color: 'var(--text-mid)', fontSize: '1.05rem', maxWidth: '680px', margin: '0 auto', lineHeight: 1.6 }}>
              Informasi resmi terkait seluruh tahapan seleksi, jadwal kegiatan lanjutan, dan pengumuman bagi calon Duta Kampus UIN Siber Syekh Nurjati Cirebon.
            </p>
          </div>

          {/* Quick Notice Banner for Logged In User */}
          {currentUser && (
            <div style={{ 
              background: '#ffffff', 
              border: '1.5px solid var(--gold)', 
              borderRadius: '16px', 
              padding: '1.25rem 1.75rem', 
              marginBottom: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 4px 20px rgba(196, 158, 89, 0.1)'
            }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '1rem' }}>
                  Akun Terhubung: {currentUser.namaLengkap || currentUser.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-mid)', marginTop: '2px' }}>
                  Periksa riwayat berkas dan notifikasi kelulusan tahapan seleksi Anda di Dashboard.
                </div>
              </div>
              <Link href="/profil" className="btn btn-gold btn-sm" style={{ textDecoration: 'none' }}>
                Buka Dashboard Peserta
              </Link>
            </div>
          )}

          {/* Announcement Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {announcements.map((ann, idx) => {
              const waClean = (ann.contactWa || contacts.whatsapp || '').replace(/\D/g, '').replace(/^0/, '62');
              const waUrl = waClean ? `https://wa.me/${waClean}` : (contacts.whatsappUrl || 'https://wa.me/6285122927628');
              const igHandle = (ann.contactIg || contacts.instagram || '').replace('@', '').trim();
              const igUrl = igHandle ? `https://www.instagram.com/${igHandle}` : (contacts.instagramUrl || 'https://www.instagram.com/duta_uinssc');
              const ttHandle = (ann.contactTiktok || contacts.tiktok || '').replace('@', '').trim();
              const ttUrl = ttHandle ? `https://www.tiktok.com/@${ttHandle}` : (contacts.tiktokUrl || 'https://www.tiktok.com/@duta.uin.ssc');
              const emailAddress = ann.contactEmail || contacts.email || 'dutakampus@uinssc.ac.id';

              return (
                <article 
                  key={ann.id || idx}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    border: '1.5px solid var(--border)',
                    boxShadow: '0 4px 25px rgba(22, 50, 74, 0.05)',
                    padding: '2.25rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Top Bar Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'var(--navy)',
                        color: 'var(--gold)',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        letterSpacing: '0.5px'
                      }}>
                        {ann.badge || 'INFORMASI PENTING'}
                      </span>
                      {ann.target === 'lolos' && (
                        <span style={{
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          Tahap Lanjutan
                        </span>
                      )}
                    </div>
                    {ann.date && (
                      <span style={{ color: 'var(--text-light)', fontSize: '0.825rem', fontWeight: 600 }}>
                        {ann.date}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 0.85rem 0', lineHeight: 1.3 }}>
                    {ann.title}
                  </h2>

                  {/* Greeting */}
                  {ann.greeting && (
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '0.85rem' }}>
                      {ann.greeting}
                    </div>
                  )}

                  {/* Content Body */}
                  <div style={{ fontSize: '0.98rem', color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '1.75rem', whiteSpace: 'pre-line' }}>
                    {ann.content}
                  </div>

                  {/* Event Schedule Box */}
                  {(ann.date || ann.time || ann.location || ann.dressCode) && (
                    <div style={{
                      background: 'var(--bg-alt)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1.5px solid var(--border)',
                      marginBottom: '1.75rem'
                    }}>
                      <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '1rem', marginBottom: '1rem' }}>
                        Informasi Pelaksanaan yang Perlu Diperhatikan:
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        {ann.date && (
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 700, letterSpacing: '0.5px' }}>
                              Hari & Tanggal
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy)', marginTop: '4px' }}>
                              {ann.date}
                            </div>
                          </div>
                        )}

                        {ann.time && (
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 700, letterSpacing: '0.5px' }}>
                              Waktu Pelaksanaan
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy)', marginTop: '4px' }}>
                              {ann.time}
                            </div>
                          </div>
                        )}

                        {ann.location && (
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 700, letterSpacing: '0.5px' }}>
                              Tempat / Lokasi
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy)', marginTop: '4px' }}>
                              {ann.location}
                            </div>
                          </div>
                        )}

                        {ann.dressCode && (
                          <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-soft)' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-light)', fontWeight: 700, letterSpacing: '0.5px' }}>
                              Dress Code / Pakaian
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy)', marginTop: '4px' }}>
                              {ann.dressCode}
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', background: '#ffffff', borderRadius: '10px', borderLeft: '4px solid var(--gold)', fontSize: '0.9rem', color: 'var(--navy)', fontWeight: 600 }}>
                        Seluruh calon Duta Kampus 2026 WAJIB hadir sebagai bagian dari rangkaian tahapan seleksi resmi. Pastikan hadir tepat waktu dan persiapkan diri sebaik mungkin.
                      </div>
                    </div>
                  )}

                  {/* Official Contacts Section */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '14px',
                    padding: '1.25rem 1.5rem',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}>
                    <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '0.95rem' }}>
                      Narahubung & Saluran Resmi Panitia:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <a 
                        href={waUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-gold"
                        style={{ textDecoration: 'none', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        WhatsApp: {ann.contactWa || contacts.whatsapp}
                      </a>
                      <a 
                        href={igUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-gold"
                        style={{ textDecoration: 'none', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        Instagram: {ann.contactIg || contacts.instagram}
                      </a>
                      <a 
                        href={ttUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-gold"
                        style={{ textDecoration: 'none', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        TikTok: {ann.contactTiktok || contacts.tiktok}
                      </a>
                      <a 
                        href={`mailto:${emailAddress}`}
                        className="btn btn-sm btn-outline-gold"
                        style={{ textDecoration: 'none', padding: '0.5rem 1.1rem', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        Email: {emailAddress}
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}

            {announcements.length === 0 && (
              <div style={{ background: '#ffffff', padding: '3rem', borderRadius: '16px', textAlign: 'center', border: '1px solid var(--border)' }}>
                <h3 style={{ color: 'var(--navy)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                  Belum Ada Pengumuman Baru
                </h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: 0 }}>
                  Pengumuman dan jadwal kegiatan seleksi terbaru akan ditampilkan di halaman ini.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
