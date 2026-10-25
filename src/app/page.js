import { getDict, getLang } from '@/lib/lang';
import FinderLoader from '@/components/Finder/FinderLoader';

export default async function Home() {
  const [t, lang] = await Promise.all([getDict(), getLang()]);

  return (
    <main>
      <h1 className="sr-only">{t.appTagline}</h1>
      <p className="sr-only">{t.appDescription}</p>
      <FinderLoader t={t} lang={lang} />
    </main>
  );
}
