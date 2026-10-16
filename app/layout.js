import { Sora } from 'next/font/google';
import MobileNav from '../components/MobileNav';
import '../styles/globals.css';
import '../styles/landing.css';
import '../styles/form.css';
import '../styles/admin.css';

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata = {
  title: 'Duta Kampus UIN Siber Syekh Nurjati Cirebon 2026',
  description: 'Program Duta Kampus UIN Siber Syekh Nurjati Cirebon. Pendaftaran dibuka untuk angkatan 2026.',
  icons: { icon: '/assets/logo-circle.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${sora.variable} ${sora.className}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={sora.className}>
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
