export interface IRoute {
  _id: string;
  routeID: string;
  distance: number;
  trafficLevel: 'Low' | 'Medium' | 'High';
  baseTime: number;
}

export interface IDriver {
  _id: string;
  name: string;
  currentShiftHours: number;
  past7DayWorkHours: number[];
  isFatigued: boolean;
}

export interface IOrder {
  _id: string;
  orderID: string;
  value_rs: number;
  assignedRoute: IRoute;
  deliveryTimestamp?: string | null;
}

export interface ISimulation {
    _id: string;
    timestamp: string;
    totalProfit: number;
    efficiencyScore: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    tags: string[];
}

export interface IDashboardStats {
    totalDrivers: number;
    totalOrders: number;
    pendingOrders: number;
    totalProfit: number;
}

// Added for authentication forms
export interface ICredentials {
    username?: string;
    password?: string;
}

export interface ISimulationParams {
    numDrivers: number;
    maxHours: number;
    startTime: string;
}