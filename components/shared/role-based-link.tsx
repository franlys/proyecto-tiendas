"use client";

import Link from "next/link";
import { useStaff, type Permission, ROUTE_PERMISSIONS } from "./staff-context";
import { type ReactNode } from "react";

interface RoleBasedLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  permission?: Permission;
  fallback?: ReactNode;
}

/**
 * A Link component that only renders if the current user has permission to access the route.
 * - If `permission` is provided, it checks that specific permission.
 * - Otherwise, it looks up the route in ROUTE_PERMISSIONS.
 * - If no permission is required for the route, it always renders.
 */
export function RoleBasedLink({
  href,
  children,
  className,
  permission,
  fallback = null,
}: RoleBasedLinkProps) {
  const { hasPermission, canAccessRoute } = useStaff();

  // Check permission
  const canAccess = permission
    ? hasPermission(permission)
    : canAccessRoute(href);

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

interface RoleBasedElementProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user permission.
 * Useful for hiding buttons, sections, or any UI element.
 */
export function RoleBasedElement({
  permission,
  children,
  fallback = null,
}: RoleBasedElementProps) {
  const { hasPermission } = useStaff();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RoleBasedRouteGuardProps {
  route: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Guards a route/page - renders children only if user can access the route.
 */
export function RoleBasedRouteGuard({
  route,
  children,
  fallback = null,
}: RoleBasedRouteGuardProps) {
  const { canAccessRoute } = useStaff();

  if (!canAccessRoute(route)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
