import axios from 'axios';
import { type ICredentials, type ISimulationParams, type IDriver, type IRoute, type IOrder  } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


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
  getChartData: () => apiClient.get('/dashboard/charts'),
  getDrivers: () => apiClient.get('/drivers'),
  getRoutes: () => apiClient.get('/routes'),
  getOrders: () => apiClient.get('/orders'),
  getSimulations: () => apiClient.get('/simulations'),
  deleteSimulation: (id: string) => apiClient.delete(`/simulations/${id}`),

  // --- Driver Actions ---
  createDriver: (driverData: Omit<IDriver, '_id'>) => apiClient.post('/drivers', driverData),
  updateDriver: (id: string, driverData: Partial<IDriver>) => apiClient.put(`/drivers/${id}`, driverData),
  deleteDriver: (id: string) => apiClient.delete(`/drivers/${id}`),
  
  // --- Route Actions ---
  createRoute: (routeData: Omit<IRoute, '_id'>) => apiClient.post('/routes', routeData),
  updateRoute: (id: string, routeData: Partial<IRoute>) => apiClient.put(`/routes/${id}`, routeData),
  deleteRoute: (id: string) => apiClient.delete(`/routes/${id}`),

createOrder: (orderData: Omit<IOrder, '_id' | 'assignedRoute'> & { assignedRoute: string }) => apiClient.post('/orders', orderData),
  updateOrder: (id: string, orderData: Partial<Omit<IOrder, '_id' | 'assignedRoute'>> & { assignedRoute?: string }) => apiClient.put(`/orders/${id}`, orderData),
  deleteOrder: (id: string) => apiClient.delete(`/orders/${id}`),

  // --- Simulation Actions ---
  runSimulation: (params: ISimulationParams) => apiClient.post('/simulate', params),
  generateAiSummary: (simulationId: string) => apiClient.post(`/simulations/${simulationId}/generate-summary`),
};