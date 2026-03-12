
import apiClient from './apiClient';

const eligibilityApi = {
    checkEligibility: async () => {
        // Assuming backend will have this endpoint, or we calculate it from stats
        // For now using student stats as a proxy for eligibility data
        const response = await apiClient.get('/student/stats');
        return response.data;
    }
};

export default eligibilityApi;
