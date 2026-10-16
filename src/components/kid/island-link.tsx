"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export function IslandLink({
  href,
  className,
  delay,
  children,
}: {
  href: string;
  className: string;
  delay: number;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div animate={reduced ? undefined : { y: [0, -6, 0] }} transition={reduced ? undefined : { duration: 3.2, delay, repeat: Infinity, ease: "easeInOut" }}>
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}
