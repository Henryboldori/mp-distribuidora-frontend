import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
  somenteAdmin?: boolean;
}

// Protege rotas: exige login, e opcionalmente exige ser ADMIN
export default function PrivateRoute({ children, somenteAdmin = false }: Props) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (somenteAdmin && usuario.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
