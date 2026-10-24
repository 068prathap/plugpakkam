import { getDict, getLang } from '@/lib/lang';
import Finder from '@/components/Finder/Finder';

export default async function Home() {
  const [t, lang] = await Promise.all([getDict(), getLang()]);

  return (
    <main>
      <Finder t={t} lang={lang} />
    </main>
  );
}
