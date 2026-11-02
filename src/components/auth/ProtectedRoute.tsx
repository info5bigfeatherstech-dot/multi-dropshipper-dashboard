import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasDropshipperPanelSession } from '../../lib/api';
import { useAppSelector } from '../../store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const hasSession = hasDropshipperPanelSession() || isAuthenticated;

  if (!hasSession) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

