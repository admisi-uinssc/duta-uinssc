'use client';
import Link from '../components/Link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-alt)', textAlign: 'center', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 900, color: 'var(--navy)', lineHeight: 1, marginBottom: '1rem' }}>
          404
        </h1>
        <h2 className="heading-lg" style={{ marginBottom: '1rem', fontSize: '2rem' }}>
          Halaman <span>Tidak Ditemukan</span>
        </h2>
        <p className="lead" style={{ marginBottom: '2rem', maxWidth: '500px' }}>
          Maaf, halaman yang Anda cari mungkin telah dihapus, namanya diubah, atau sementara tidak tersedia.
        </p>
        <Link href="/" className="btn btn-gold btn-lg">
          Kembali ke Beranda
        </Link>
      </div>
      <Footer />
    </>
  );
}
