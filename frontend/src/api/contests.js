import api from './auth';

export const generateContest = async () => {
  const response = await api.get('/api/contests/generate');
  return response.data;
};

export const getActiveContest = async () => {
  const response = await api.get('/api/contests/active');
  return response.data;
};

export const markQuestionSolved = async (questionId) => {
  const response = await api.post('/api/contests/mark-solved', { questionId });
  return response.data;
};

export const completeContest = async () => {
  const response = await api.post('/api/contests/complete');
  return response.data;
};

export const abandonContest = async () => {
  const response = await api.post('/api/contests/abandon');
  return response.data;
};

export const getContestHistory = async () => {
  const response = await api.get('/api/contests/history');
  return response.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/api/contests/profile');
  return response.data;
};

export const getContest = async (contestId) => {
  const response = await api.get(`/api/contests/${contestId}`);
  return response.data;
};
