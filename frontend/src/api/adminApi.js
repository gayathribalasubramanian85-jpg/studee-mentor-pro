import apiClient from './apiClient';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

const adminApi = {
    createTest: async (testData) => {
        const response = await apiClient.post('/admin/tests', testData);
        return response.data;
    },

    getTests: async () => {
        const response = await apiClient.get('/admin/tests');
        return response.data;
    },

    updateTest: async (id, testData) => {
        const response = await apiClient.put(`/admin/tests/${id}`, testData);
        return response.data;
    },

    deleteTest: async (id) => {
        const response = await apiClient.delete(`/admin/tests/${id}`);
        return response.data;
    },

    uploadMaterial: async (materialData) => {
        // Direct axios call to avoid apiClient header issues with FormData
        const user = JSON.parse(localStorage.getItem('user'));
        const token = user?.token;

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                // Axios will automatically set the correct Content-Type (multipart/form-data) with boundary
            }
        };

        const response = await axios.post(`${API_URL}/admin/materials`, materialData, config);
        return response.data;
    },

    deleteMaterial: async (id) => {
        const response = await apiClient.delete(`/admin/materials/${id}`);
        return response.data;
    },

    updateMaterial: async (id, materialData) => {
        const response = await apiClient.put(`/admin/materials/${id}`, materialData);
        return response.data;
    },

    getStudentProgress: async () => {
        const response = await apiClient.get('/admin/students/progress');
        return response.data;
    },

    uploadStudentsCsv: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/admin/upload-students', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateStudent: async (id, studentData) => {
        const response = await apiClient.put(`/admin/students/${id}`, studentData);
        return response.data;
    },

    createStudent: async (studentData) => {
        const response = await apiClient.post('/admin/students', studentData);
        return response.data;
    },

    deleteStudent: async (id) => {
        const response = await apiClient.delete(`/admin/students/${id}`);
        return response.data;
    },

    changePassword: async (passwordData) => {
        const response = await apiClient.put('/admin/change-password', passwordData);
        return response.data;
    },

    getReports: async (department = null) => {
        const params = department ? { department } : {};
        const response = await apiClient.get('/admin/reports', { params });
        return response.data;
    },

    // Week management
    createWeek: async (weekData) => {
        const response = await apiClient.post('/admin/weeks', weekData);
        return response.data;
    },

    getWeeks: async () => {
        const response = await apiClient.get('/admin/weeks');
        return response.data;
    },

    updateWeek: async (id, weekData) => {
        const response = await apiClient.put(`/admin/weeks/${id}`, weekData);
        return response.data;
    },

    deleteWeek: async (id) => {
        const response = await apiClient.delete(`/admin/weeks/${id}`);
        return response.data;
    },

    // Manual reminder trigger (for testing)
    sendReminders: async () => {
        const response = await apiClient.post('/admin/send-reminders');
        return response.data;
    }
};

export default adminApi;