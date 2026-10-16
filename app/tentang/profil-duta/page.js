'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Image from 'next/image';
import { CMS } from '../../../lib/cms';

export default function ProfilDutaPage() {
  const [ambassadors, setAmbassadors] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('ALL');

  useEffect(() => {
    setAmbassadors(CMS.get().ambassadors || []);
    const unsubscribe = CMS.subscribe((data) => {
      if (data && data.ambassadors) {
        setAmbassadors(data.ambassadors);
      }
    });
    return unsubscribe;
  }, []);

  const faculties = ['ALL', ...new Set(ambassadors.map(a => a.faculty).filter(Boolean))];

  const filtered = selectedFaculty === 'ALL'
    ? ambassadors
    : ambassadors.filter(a => a.faculty === selectedFaculty);

  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ paddingTop: '100px', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-alt)' }}>
        <div className="container" style={{ maxWidth: '1480px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div className="section-header text-center" style={{ marginBottom: '2.5rem' }}>
            <span className="eyebrow">Duta Mahasiswa</span>
            <h1 className="heading-lg">Profil <span>Duta Kampus</span></h1>
            <p className="lead" style={{ margin: '0 auto 1.5rem' }}>
              Mengenal lebih dekat representasi mahasiswa unggul UIN Siber Syekh Nurjati Cirebon.
            </p>

            {/* Filter buttons */}
            {faculties.length > 2 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
                {faculties.map(fac => (
                  <button
                    key={fac}
                    type="button"
                    onClick={() => setSelectedFaculty(fac)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: selectedFaculty === fac ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                      background: selectedFaculty === fac ? 'var(--gold)' : '#fff',
                      color: selectedFaculty === fac ? '#fff' : 'var(--navy)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {fac === 'ALL' ? 'Semua Fakultas' : fac}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="ambassador-grid">
            {filtered.map((duta) => (
              <div key={duta.id} className="ambassador-card">
                <div className="ambassador-img-wrapper" style={{ position: 'relative' }}>
                  <Image 
                    src={duta.img || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=600&q=80'} 
                    alt={duta.name} 
                    fill 
                    quality={85}
                    sizes="(max-width: 768px) 100vw, 320px"
                    style={{ objectFit: 'cover' }} 
                    unoptimized={duta.img && duta.img.startsWith('http') && !duta.img.includes('unsplash')}
                  />
                  {duta.faculty && (
                    <div className="ambassador-badge">
                      {duta.faculty}
                    </div>
                  )}
                </div>
                <div className="ambassador-info">
                  <h3>{duta.name}</h3>
                  <p>{duta.major || duta.faculty || 'Duta Kampus'}</p>
                  {duta.year && (
                    <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600 }}>
                      Angkatan {duta.year}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-light)', padding: '3rem 0' }}>
                Data Profil Duta Kampus belum tersedia.
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <style jsx>{`
        .ambassador-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 2rem;
          padding-bottom: 4rem;
        }
        .ambassador-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        .ambassador-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(196,158,89,0.15);
        }
        .ambassador-img-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 3/4;
        }
        .ambassador-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: var(--gold);
          color: #fff;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .ambassador-info {
          padding: 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .ambassador-info h3 {
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--navy);
          margin-bottom: 0.25rem;
        }
        .ambassador-info p {
          font-size: 0.85rem;
          color: var(--text-light);
          margin: 0;
        }
      `}</style>
    </>
  );
}
