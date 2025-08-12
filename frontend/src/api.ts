import axios from 'axios';
import { type ICredentials, type ISimulationParams, type IDriver } from './types';

const API_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const api = {
  // --- Auth ---
  login: (credentials: ICredentials) => apiClient.post('/login', credentials),
  register: (userData: ICredentials) => apiClient.post('/register', userData),
  logout: () => apiClient.post('/logout'),
  checkAuthStatus: () => apiClient.get('/auth/status'),

  // --- Data Fetching ---
  getDashboardStats: () => apiClient.get('/dashboard/stats'),
  getDrivers: () => apiClient.get('/drivers'),
  getRoutes: () => apiClient.get('/routes'),
  getOrders: () => apiClient.get('/orders'),
  getSimulations: () => apiClient.get('/simulations'),

  // --- Driver Actions ---
  createDriver: (driverData: Omit<IDriver, '_id'>) => apiClient.post('/drivers', driverData),
  updateDriver: (id: string, driverData: Partial<IDriver>) => apiClient.put(`/drivers/${id}`, driverData),
  deleteDriver: (id: string) => apiClient.delete(`/drivers/${id}`),

  // --- Simulation Actions ---
  runSimulation: (params: ISimulationParams) => apiClient.post('/simulate', params),
  generateAiSummary: (simulationId: string) => apiClient.post(`/simulations/${simulationId}/generate-summary`),
};