
import axios from 'axios';

// Base URL configuration
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to inject token
apiClient.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Only handle token expiration, not login failures
            const isLoginRequest = error.config?.url?.includes('/auth/login');
            
            if (!isLoginRequest && !window.location.pathname.includes('/login')) {
                // Token invalid or expired - logout user
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
