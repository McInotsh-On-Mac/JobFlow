import Link from "next/link";
import { logout } from "../lib/auth-actions";
import BrandLogo from "./BrandLogo";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  current: "dashboard" | "applications";
};

const links = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "applications", href: "/applications", label: "Applications" },
] as const;

export default function AppHeader({ current }: AppHeaderProps) {
  return (
    <header className={styles.topBar}>
      <BrandLogo size="medium" asset="video" priority />

      <div className={styles.right}>
        <nav className={styles.nav} aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={current === link.key ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.profileWrap}>
          <button className={styles.profileButton} type="button" aria-label="Profile menu">
            <span className={styles.avatar}>P</span>
          </button>

          <div className={styles.dropdown} role="menu" aria-label="Profile actions">
            <form action={logout}>
              <button className={styles.dropdownButton} type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
