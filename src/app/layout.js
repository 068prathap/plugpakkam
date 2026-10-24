import { Hind_Madurai, Plus_Jakarta_Sans } from 'next/font/google';
import { getDict, getLang } from '@/lib/lang';
import { siteUrl } from '@/lib/site';
import Header from '@/components/Header/Header';
import RegisterWorker from '@/components/RegisterWorker/RegisterWorker';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-main',
});

const hindMadurai = Hind_Madurai({
  weight: ['400', '500', '600', '700'],
  subsets: ['tamil'],
  variable: '--font-tamil',
});

export async function generateMetadata() {
  const t = await getDict();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `PlugPakkam | ${t.appTagline}`,
      template: '%s | PlugPakkam',
    },
    description: t.appDescription,
    appleWebApp: { capable: true, title: 'PlugPakkam', statusBarStyle: 'default' },
    openGraph: {
      siteName: 'PlugPakkam',
      type: 'website',
      locale: 'en_IN',
    },
  };
}

export const viewport = {
  themeColor: '#0b8a45',
};

export default async function RootLayout({ children }) {
  const lang = await getLang();

  return (
    <html lang={lang} className={`${jakarta.variable} ${hindMadurai.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Header />
        {children}
        <RegisterWorker />
      </body>
    </html>
  );
}
