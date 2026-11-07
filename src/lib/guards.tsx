import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { RoleType } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: RoleType[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wrong role = redirect directly to own dashboard
  if (!allowedRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }

  return <>{children}</>;
}
