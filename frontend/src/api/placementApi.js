
import apiClient from './apiClient';

const placementApi = {
    createJob: async (jobData) => {
        const response = await apiClient.post('/placement/jobs', jobData);
        return response.data;
    },

    getJobs: async () => {
        const response = await apiClient.get('/placement/jobs');
        return response.data;
    },

    deleteJob: async (jobId) => {
        const response = await apiClient.delete(`/placement/jobs/${jobId}`);
        return response.data;
    },

    updateJob: async (jobId, jobData) => {
        const response = await apiClient.put(`/placement/jobs/${jobId}`, jobData);
        return response.data;
    },

    getApplications: async () => {
        const response = await apiClient.get('/placement/applications');
        return response.data;
    },

    getAllStudents: async () => {
        const response = await apiClient.get('/placement/students');
        return response.data;
    },

    changePassword: async (passwordData) => {
        const response = await apiClient.put('/placement/change-password', passwordData);
        return response.data;
    },

    // Manual job application reminder trigger (for testing)
    sendJobReminders: async () => {
        const response = await apiClient.post('/placement/send-job-reminders');
        return response.data;
    }
};

export default placementApi;
