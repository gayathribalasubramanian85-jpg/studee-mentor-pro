
import apiClient from './apiClient';

const studentApi = {
    getStats: async () => {
        const response = await apiClient.get('/student/stats');
        return response.data;
    },

    getJobs: async () => {
        const response = await apiClient.get('/student/jobs');
        return response.data;
    },

    applyToJob: async (jobId) => {
        const response = await apiClient.post(`/student/jobs/${jobId}/apply`);
        return response.data;
    },

    getProfile: async () => {
        const response = await apiClient.get('/student/profile');
        return response.data;
    },

    updateProfile: async (formData) => {
        const response = await apiClient.put('/student/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    getWeeks: async () => {
        const response = await apiClient.get('/student/weeks');
        return response.data;
    },

    getApplications: async () => {
        const response = await apiClient.get('/student/applications');
        return response.data;
    }
};

export default studentApi;
