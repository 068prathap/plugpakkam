import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { getDict, getLang } from '@/lib/lang';
import { setLang } from '@/app/actions/lang';
import { signOut } from '@/app/actions/auth';
import Logo from '@/components/Logo/Logo';
import styles from './Header.module.css';

async function Header() {
  const [user, t, lang] = await Promise.all([getCurrentUser(), getDict(), getLang()]);
  const otherLang = lang === 'ta' ? 'en' : 'ta';

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <Logo />
          <span>
            Plug<b>Pakkam</b>
          </span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/host" className={styles.share}>
            {user ? t.nav.myPlaces : t.nav.share}
          </Link>
          <form action={setLang.bind(null, otherLang)}>
            <button type="submit" className={styles.lang} lang={otherLang} aria-label="Change language">
              {otherLang === 'ta' ? 'த' : 'EN'}
            </button>
          </form>
          {user && (
            <form action={signOut}>
              <button type="submit" className={styles.link}>
                {t.nav.signOut}
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
