
import { Navigate, useLocation } from 'react-router-dom';
import authApi from '@/api/authApi';

const RoleBasedRoute = ({ children, allowedRoles }) => {
    const user = authApi.getCurrentUser();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
        if (user.role === 'faculty') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'placementofficer') return <Navigate to="/placement/dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default RoleBasedRoute;
