'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './master-menu.module.css';

function GridIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

const ITEMS = [
  { label: 'stores', path: '/dashboard/master/stores' },
  { label: 'categories', path: '/dashboard/master/categories' },
  { label: 'base units', path: '/dashboard/master/base-units' },
];

export function MasterMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  return (
    <div className={styles.wrapper}>
      <button className={styles.trigger} onClick={() => setOpen((v) => !v)}>
        <GridIcon />
        <span>master</span>
      </button>
      {open && (
        <>
          <div className={styles.menu}>
            {ITEMS.map((item) => (
              <button key={item.path} className={styles.item} onClick={() => go(item.path)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}
