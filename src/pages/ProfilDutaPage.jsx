import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Image from '../components/Image';
import { CMS } from '../lib/cms';

export default function ProfilDutaPage() {
  const [ambassadors, setAmbassadors] = useState([]);

  useEffect(() => {
    setAmbassadors(CMS.get().ambassadors || []);
    const unsubscribe = CMS.subscribe((data) => {
      if (data && data.ambassadors) {
        setAmbassadors(data.ambassadors);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ paddingTop: '100px', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-alt)' }}>
        <div className="container">
          <div className="section-header text-center" style={{ marginBottom: '2.5rem' }}>
            <h1 className="heading-lg">Profil <span>Duta Kampus</span></h1>
            <p className="lead" style={{ margin: '0.5rem auto 1.5rem' }}>
              Mengenal representasi mahasiswa unggul UIN Siber Syekh Nurjati Cirebon.
            </p>
          </div>
          
          <div className="ambassador-grid">
            {ambassadors.map((duta) => (
              <div key={duta.id} className="ambassador-card">
                <div className="ambassador-img-wrapper" style={{ position: 'relative' }}>
                  <Image 
                    src={duta.img || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=600&q=80'} 
                    alt={duta.name} 
                    fill 
                    style={{ objectFit: 'cover' }} 
                    fallbackSrc="https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=600&q=80"
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
            {ambassadors.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-light)', padding: '3rem 0' }}>
                Data Profil Duta Kampus belum tersedia.
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
