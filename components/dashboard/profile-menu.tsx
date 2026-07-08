'use client';

import { useRouter } from 'next/navigation';
import styles from './profile-menu.module.css';

function SettingsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.32 2.37a2 2 0 0 1 3.36 0l.86 1.4a2 2 0 0 0 2.14.89l1.6-.42a2 2 0 0 1 2.37 2.37l-.42 1.6a2 2 0 0 0 .89 2.14l1.4.86a2 2 0 0 1 0 3.36l-1.4.86a2 2 0 0 0-.89 2.14l.42 1.6a2 2 0 0 1-2.37 2.37l-1.6-.42a2 2 0 0 0-2.14.89l-.86 1.4a2 2 0 0 1-3.36 0l-.86-1.4a2 2 0 0 0-2.14-.89l-1.6.42a2 2 0 0 1-2.37-2.37l.42-1.6a2 2 0 0 0-.89-2.14l-1.4-.86a2 2 0 0 1 0-3.36l1.4-.86a2 2 0 0 0 .89-2.14l-.42-1.6a2 2 0 0 1 2.37-2.37l1.6.42a2 2 0 0 0 2.14-.89l.86-1.4Z" />
      <circle cx="12" cy="12" r="3.25" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 8.25V6a2.25 2.25 0 0 0-2.25-2.25h-6a2.25 2.25 0 0 0-2.25 2.25v12a2.25 2.25 0 0 0 2.25 2.25h6A2.25 2.25 0 0 0 15.75 18v-2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 12h9M18 9.75l2.25 2.25L18 14.25" />
    </svg>
  );
}

interface ProfileMenuProps {
  onClose: () => void;
}

export function ProfileMenu({ onClose }: ProfileMenuProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  function handleSettings() {
    onClose();
    router.push('/dashboard/settings');
  }

  return (
    <div className={styles.menu}>
      <div className={styles.userInfo}>
        <p className={`${styles.userLabel} text-xs`}>logged in as</p>
        <p className={`${styles.userName} text-sm font-bold`}>admin</p>
      </div>
      <div className={styles.divider} />
      <button className={`${styles.menuItem} text-sm`} onClick={handleSettings}>
        <SettingsIcon />
        <span>settings</span>
      </button>
      <button className={`${styles.menuItem} text-sm`} onClick={handleLogout}>
        <LogoutIcon />
        <span>log out</span>
      </button>
    </div>
  );
}