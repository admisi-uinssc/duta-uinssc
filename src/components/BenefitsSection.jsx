'use client';

export default function BenefitsSection() {
  const items = [
    {
      num: '01',
      title: 'Peningkatan Public Speaking',
      desc: 'Berinteraksi langsung dengan calon mahasiswa baru di sekolah-sekolah se-Ciayumajakuning dan sekitarnya, melatih kepercayaan diri dan komunikasi persuasif.'
    },
    {
      num: '02',
      title: 'Perluasan Relasi & Jaringan',
      desc: 'Membangun koneksi luas bersama pimpinan universitas, civitas akademika, dinas pendidikan, mitra eksternal, dan sesama mahasiswa berprestasi.'
    },
    {
      num: '03',
      title: 'CV & Portofolio Berkualitas',
      desc: 'Memperkuat rekam jejak kepemimpinan serta memahami implementasi strategi promosi multimedia dan hubungan masyarakat secara nyata.'
    },
    {
      num: '04',
      title: 'Klaim KKN Rekognisi',
      desc: 'Aktivitas pengabdian promosi kampus dan sosialisasi sekolah dapat diajukan sebagai bentuk ekuivalensi program KKN Rekognisi sesuai ketentuan kampus.'
    },
  ];

  return (
    <section className="section-pad bg-alt" id="benefits">
      <div className="container">
        <div className="section-header text-center" style={{ maxWidth: '720px', margin: '0 auto 2.5rem' }}>
          <h2 className="heading-lg">Kenapa Harus <span>Bergabung?</span></h2>
          <p className="lead">
            Bergabung bersama Paguyuban Duta Kampus UIN SSC memberikan keuntungan pengembangan diri, portofolio unggul, dan rekognisi akademik resmi.
          </p>
        </div>
        
        <div className="benefits-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {items.map((item, idx) => (
            <div key={idx} className="benefit-card card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.75rem 1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
              <div className="benefit-num" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gold)', marginBottom: '0.75rem' }}>{item.num}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem' }}>{item.title}</h3>
              <div className="benefit-divider" style={{ width: '40px', height: '2px', background: 'var(--gold)', marginBottom: '0.75rem' }}></div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
