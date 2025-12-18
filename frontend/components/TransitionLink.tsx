"use client";

import Link, { LinkProps } from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "@/context/TransitionContext";
import React from "react";

interface TransitionLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export default function TransitionLink({ children, href, className, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();
  const { triggerTransition } = useTransition();

  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If it's a hash link on the same route, a new tab, or external, use standard behavior
    const hrefString = href.toString();
    const isHashLink = hrefString.includes("#");
    const isSameRoute = hrefString.startsWith(pathname) || (pathname === "/" && hrefString.startsWith("/#"));

    if (isHashLink && isSameRoute || e.metaKey || e.ctrlKey) {
      if (onClick) onClick(e);
      return;
    }

    e.preventDefault();
    if (onClick) onClick(e);
    
    triggerTransition(() => {
      router.push(hrefString);
    });
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
