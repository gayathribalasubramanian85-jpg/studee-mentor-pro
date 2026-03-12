
import apiClient from './apiClient';

const authApi = {
    login: async (email, password, role, department, year) => {
        const response = await apiClient.post('/auth/login', { email, password, role, department, year });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    register: async (userData) => {
        const response = await apiClient.post('/auth/register', userData);
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('user'));
    },

    getProfile: async () => {
        const response = await apiClient.get('/auth/profile');
        return response.data;
    }
};

export default authApi;
