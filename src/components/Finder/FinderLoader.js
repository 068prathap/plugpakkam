'use client';

import dynamic from 'next/dynamic';
import styles from './Finder.module.css';

const Finder = dynamic(() => import('./Finder'), {
  ssr: false,
  loading: () => <div className={styles.app} />,
});

function FinderLoader(props) {
  return <Finder {...props} />;
}

export default FinderLoader;
