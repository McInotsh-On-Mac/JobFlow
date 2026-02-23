import Image from "next/image";
import Link from "next/link";
import styles from "./BrandLogo.module.css";

type BrandLogoProps = {
  href?: string | null;
  size?: "small" | "medium" | "large";
  priority?: boolean;
};

export default function BrandLogo({
  href = "/",
  size = "small",
  priority = false,
}: BrandLogoProps) {
  const width = size === "large" ? 300 : size === "medium" ? 220 : 180;
  const height = size === "large" ? 84 : size === "medium" ? 62 : 50;
  const sizeClass = size === "large" ? styles.large : size === "medium" ? styles.medium : styles.small;
  const className = `${styles.logo} ${sizeClass}`;

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
