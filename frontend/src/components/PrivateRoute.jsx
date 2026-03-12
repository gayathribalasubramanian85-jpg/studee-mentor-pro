
import { Navigate, useLocation } from 'react-router-dom';
import authApi from '@/api/authApi';

const PrivateRoute = ({ children }) => {
    const user = authApi.getCurrentUser();
    const location = useLocation();

    if (!user) {
        // Redirect to login but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;
