import { Navigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, userDoc } = UserAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Admin-only protection
  if (adminOnly) {
     const isAdmin = user.email === 'danielacopana@gmail.com' || userDoc?.isAdmin === true;
     if (!isAdmin) {
        return <Navigate to="/" />;
     }
  }

  return children;
};

export default ProtectedRoute;
