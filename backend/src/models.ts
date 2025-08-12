import mongoose, { Document, Schema } from 'mongoose';

// --- User ---
export interface IUser extends Document {
    username: string;
    password?: string;
}
const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
});
export const User = mongoose.model<IUser>('User', UserSchema);


// --- Driver ---
export interface IDriver extends Document {
    name: string;
    currentShiftHours: number;
    past7DayWorkHours: number[];
    isFatigued: boolean;
}
const DriverSchema: Schema = new Schema({
    name: { type: String, required: true },
    currentShiftHours: { type: Number, default: 0 },
    past7DayWorkHours: { type: [Number], default: [0,0,0,0,0,0,0] },
    isFatigued: { type: Boolean, default: false }
});
export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);


// --- Route ---
export interface IRoute extends Document {
    routeID: string;
    distance: number;
    trafficLevel: 'Low' | 'Medium' | 'High';
    baseTime: number;
}
const RouteSchema: Schema = new Schema({
    routeID: { type: String, required: true, unique: true },
    distance: { type: Number, required: true },
    trafficLevel: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    baseTime: { type: Number, required: true },
});
export const Route = mongoose.model<IRoute>('Route', RouteSchema);


// --- Order ---
export interface IOrder extends Document {
    orderID: string;
    value_rs: number;
    assignedRoute: IRoute['_id'];
    deliveryTimestamp?: Date;
    isDeliveredOnTime?: boolean;
}
const OrderSchema: Schema = new Schema({
    orderID: { type: String, required: true, unique: true },
    value_rs: { type: Number, required: true },
    assignedRoute: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
    deliveryTimestamp: { type: Date },
    isDeliveredOnTime: { type: Boolean }
});
export const Order = mongoose.model<IOrder>('Order', OrderSchema);


// --- Simulation ---
export interface ISimulation extends Document {
    timestamp: Date;
    totalProfit: number;
    efficiencyScore: number;
    onTimeDeliveries: number;
    lateDeliveries: number;
    fuelCostBreakdown: { [key: string]: number };
    aiSummary: string;
}
const SimulationSchema: Schema = new Schema({
    timestamp: { type: Date, default: Date.now },
    totalProfit: Number,
    efficiencyScore: Number,
    onTimeDeliveries: Number,
    lateDeliveries: Number,
    fuelCostBreakdown: Schema.Types.Mixed,
    aiSummary: String,
});
export const Simulation = mongoose.model<ISimulation>('Simulation', SimulationSchema);
