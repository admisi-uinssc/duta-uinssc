'use client';

import React, { useState, useEffect } from 'react';
import { CMS } from '../lib/cms';

export default function TimelineSection() {
  const [cmsData, setCmsData] = useState(CMS.get());

  useEffect(() => {
    setCmsData(CMS.get());
    const unsubscribe = CMS.subscribe((data) => {
      setCmsData(data);
    });
    return () => unsubscribe();
  }, []);

  const steps = [
    { num: '01', date: '5 – 15 Oktober 2026', title: 'Batch 1: Pendaftaran', desc: 'Pengisian formulir pendaftaran akun dan pemenuhan berkas administrasi.' },
    { num: '02', date: '17 s.d. 25 Oktober 2026', title: 'Batch 2: Perpanjangan', desc: 'Masa perpanjangan pendaftaran dan perbaikan berkas peserta.' },
    { num: '03', date: '31 Oktober 2026', title: 'Technical Meeting', desc: 'Pengarahan teknis mekanisme seleksi dan tata tertib pemilihan.' },
    { num: '04', date: '3 November 2026', title: 'Seleksi Tahap 1 (Wawancara)', desc: 'Penilaian wawasan kebangsaan, keislaman, kelembagaan UIN SSC, dan motivasi.' },
    { num: '05', date: '7 November 2026', title: 'Seleksi Tahap 2 (Unjuk Bakat)', desc: 'Penampilan minat bakat seni, budaya, public speaking, atau inovasi.' },
    { num: '06', date: '9 November 2026', title: 'Pengukuhan Duta Kampus', desc: 'Penetapan resmi dan pengukuhan Duta Kampus UIN SSC 2026.' },
  ];

  const announcements = (cmsData?.announcements || []).filter(
    a => a.active !== false && (a.target === 'publik' || a.target === 'all' || !a.target)
  );
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
    <section className="section-pad" id="timeline">
      <div className="container">
        <div className="section-header">
          <h2 className="heading-lg"><span>Timeline</span> Pemilihan</h2>
          <p className="lead">Catat jadwal resmi tahapan Pemilihan Duta Kampus UIN Siber Syekh Nurjati Cirebon 2026.</p>
        </div>
        
        <div className="timeline-wrap">
          <div className="timeline-track"></div>
          {steps.map((step, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-dot">{step.num}</div>
              <div className="timeline-body">
                <div className="timeline-date">{step.date}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pengumuman Pelaksanaan Seleksi (CMS Synced) */}
        {announcements.length > 0 && (
          <div style={{ marginTop: '4rem', borderTop: '2px solid var(--border)', paddingTop: '3rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 0.5rem 0' }}>
                Pengumuman Pelaksanaan Seleksi
              </h3>
              <p style={{ color: 'var(--text-mid)', fontSize: '0.95rem', margin: 0 }}>
                Informasi dan agenda pelaksanaan tahapan Pemilihan Duta Kampus UIN Siber Syekh Nurjati Cirebon.
              </p>
            </div>

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
                  <div 
                    key={ann.id || idx}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid var(--border)',
                      borderLeft: '5px solid var(--gold)',
                      borderRadius: '8px',
                      padding: '2rem',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 0.75rem 0' }}>
                      {ann.title}
                    </h4>

                    {ann.greeting && (
                      <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem' }}>
                        {ann.greeting}
                      </p>
                    )}

                    <p style={{ fontSize: '0.95rem', color: 'var(--text-mid)', lineHeight: 1.7, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
                      {ann.content}
                    </p>

                    {(ann.date || ann.time || ann.location || ann.dressCode) && (
                      <div style={{ background: 'var(--bg-alt)', borderRadius: '6px', padding: '1.25rem', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '0.95rem', marginBottom: '0.85rem' }}>
                          Informasi Pelaksanaan yang Perlu Diperhatikan:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                          {ann.date && (
                            <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700 }}>Hari & Tanggal</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', marginTop: '2px' }}>{ann.date}</div>
                            </div>
                          )}
                          {ann.time && (
                            <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700 }}>Waktu</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', marginTop: '2px' }}>{ann.time}</div>
                            </div>
                          )}
                          {ann.location && (
                            <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700 }}>Tempat / Lokasi</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', marginTop: '2px' }}>{ann.location}</div>
                            </div>
                          )}
                          {ann.dressCode && (
                            <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700 }}>Dress Code</div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', marginTop: '2px' }}>{ann.dressCode}</div>
                            </div>
                          )}
                        </div>
                        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fef2f2', borderLeft: '4px solid #dc2626', color: '#991b1b', fontWeight: 700, fontSize: '0.875rem', borderRadius: '4px' }}>
                          Wajib hadir tepat waktu.
                        </div>
                      </div>
                    )}

                    <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.65rem' }}>
                        Hubungi panitia:
                      </div>
                      <div>
                        <a 
                          href={waUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-sm btn-gold"
                          style={{ textDecoration: 'none', padding: '0.45rem 1.15rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}
                        >
                          WhatsApp: {ann.contactWa || contacts.whatsapp}
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
