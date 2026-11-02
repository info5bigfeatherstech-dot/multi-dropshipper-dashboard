import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasDropshipperPanelSession } from '../../lib/api';
import { useAppSelector } from '../../store/hooks';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const hasSession = hasDropshipperPanelSession() || isAuthenticated;

  if (hasSession) {
    const from = (location.state as any)?.from?.pathname || '/products';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

