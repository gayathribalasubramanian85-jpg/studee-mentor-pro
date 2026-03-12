
import apiClient from './apiClient';

const studyApi = {
    getMaterials: async () => {
        const response = await apiClient.get('/student/materials');
        return response.data;
    },

    logStudyTime: async (logData) => {
        const response = await apiClient.post('/student/study-log', logData);
        return response.data;
    }
};

export default studyApi;
