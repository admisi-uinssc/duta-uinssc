'use client';

export default function TimelineSection() {
  const steps = [
    { num: '01', date: '5 – 15 Oktober 2026', title: 'Batch 1: Pendaftaran', desc: 'Pengisian formulir pendaftaran akun dan pemenuhan berkas administrasi.' },
    { num: '02', date: '17 s.d. 26 Oktober 2026', title: 'Batch 2: Perpanjangan', desc: 'Masa perpanjangan pendaftaran dan perbaikan berkas peserta.' },
    { num: '03', date: '31 Oktober 2026', title: 'Technical Meeting', desc: 'Pengarahan teknis mekanisme seleksi dan tata tertib pemilihan.' },
    { num: '04', date: '3 November 2026', title: 'Seleksi Tahap 1 (Wawancara)', desc: 'Penilaian wawasan kebangsaan, keislaman, kelembagaan UIN SSC, dan motivasi.' },
    { num: '05', date: '7 November 2026', title: 'Seleksi Tahap 2 (Unjuk Bakat)', desc: 'Penampilan minat bakat seni, budaya, public speaking, atau inovasi.' },
    { num: '06', date: '9 November 2026', title: 'Pengukuhan Duta Kampus', desc: 'Penetapan resmi dan pengukuhan Duta Kampus UIN SSC 2026.' },
  ];

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
      </div>
    </section>
  );
}
