"use client";

import { usePathname } from "next/navigation";
import { FloatingCart } from "@/components/shop";

export function CartUnlessTraining() {
  const pathname = usePathname();
  if (pathname.endsWith("/training")) return null;
  return <FloatingCart />;
}
