'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ProfileMenu } from './profile-menu';
import { FullscreenToggle } from './fullscreen-toggle';
import { MasterMenu } from './master/master-menu';
import styles from './header.module.css';

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.98 19.37A9 9 0 0 0 12 16.9a9 9 0 0 0-5.98 2.47" />
      <circle cx="12" cy="10" r="3.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const pathLabel = pathname === '/dashboard' ? '~/dashboard' : `~/dashboard${pathname.replace('/dashboard', '')}`;

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <p className={`${styles.title} text-base font-bold`}>* Amiplast</p>
        <MasterMenu />
        <Link href="/dashboard/products" className={styles.trigger}>
          products
        </Link>
        <p className={`${styles.path} text-xs`}>{pathLabel}</p>
      </div>
      <div className={styles.right}>
        <FullscreenToggle />
        <button
          className={styles.profileButton}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Profile menu"
        >
          <UserIcon />
        </button>
        {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
        {menuOpen && <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />}
      </div>
    </header>
  );
}