import axios from 'axios';
import { type ICredentials, type ISimulationParams } from './types';

const API_URL = 'http://localhost:5000/api'; 

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  login: (credentials: ICredentials) => apiClient.post('/login', credentials),
  register: (userData: ICredentials) => apiClient.post('/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    return apiClient.post('/logout');
  },
  getDashboardStats: () => apiClient.get('/dashboard/stats'),
  getDrivers: () => apiClient.get('/drivers'),
  getRoutes: () => apiClient.get('/routes'),
  getOrders: () => apiClient.get('/orders'),
  getSimulations: () => apiClient.get('/simulations'),
  runSimulation: (params: ISimulationParams) => apiClient.post('/simulate', params),
  generateAiSummary: (simulationId: string) => apiClient.post(`/simulations/${simulationId}/generate-summary`),
};
