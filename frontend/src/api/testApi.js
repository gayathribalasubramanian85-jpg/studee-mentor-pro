
import apiClient from './apiClient';

const testApi = {
    getTests: async () => {
        const response = await apiClient.get('/student/tests');
        return response.data;
    },

    submitTest: async (submissionData) => {
        const response = await apiClient.post('/student/test/submit', submissionData);
        return response.data;
    },

    getTestResults: async () => {
        const response = await apiClient.get('/student/test-results');
        return response.data;
    }
};

export default testApi;
