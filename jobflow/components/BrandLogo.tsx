import Image from "next/image";
import Link from "next/link";
import styles from "./BrandLogo.module.css";

type BrandLogoProps = {
  href?: string | null;
  size?: "small" | "large";
  priority?: boolean;
};

export default function BrandLogo({
  href = "/",
  size = "small",
  priority = false,
}: BrandLogoProps) {
  const width = size === "large" ? 300 : 180;
  const height = size === "large" ? 84 : 50;
  const className = size === "large" ? `${styles.logo} ${styles.large}` : `${styles.logo} ${styles.small}`;

  const logo = (
    <Image
      src="/jobflow-logo.svg"
      alt="JobFlow"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );

  if (!href) {
    return <span className={styles.standalone}>{logo}</span>;
  }

  return (
    <Link href={href} className={styles.link} aria-label="JobFlow">
      {logo}
    </Link>
  );
}
