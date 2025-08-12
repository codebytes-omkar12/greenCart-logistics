import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { GoogleGenerativeAI } from "@google/generative-ai";

import {
    User, Driver, Route, Order, Simulation,
    IUser, IDriver, IRoute, IOrder
} from './models';

// Initialize AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- AUTH CONTROLLERS ---

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, password }: IUser = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'Manager registered successfully.' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { username, password }: IUser = req.body;
        
        // 1. Add a check for the incoming password to satisfy TypeScript
        if (!password) {
            return res.status(400).json({ message: 'Password is required.' });
        }

        const user: IUser | null = await User.findOne({ username }).select('+password');

        // 2. This check now correctly handles both the user and their password
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 3. This check confirms user._id exists before using it, solving the error
        if (user._id) {
            req.session.userId = user._id.toString();
            res.json({ message: 'Logged in successfully.' });
        } else {
            // This case is unlikely but makes TypeScript happy
            throw new Error('User ID not found after successful login.');
        }

    } catch (error: any) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};

export const logoutUser = (req: Request, res: Response) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Logged out successfully.' });
    });
};

export const getAuthStatus = (req: Request, res: Response) => {
    if (req.session && req.session.userId) {
        res.status(200).json({ isLoggedIn: true, userId: req.session.userId });
    } else {
        res.status(200).json({ isLoggedIn: false });
    }
};

// --- CRUD CONTROLLERS ---

export const getDrivers = async (req: Request, res: Response) => {
    try {
        const drivers: IDriver[] = await Driver.find();
        res.json(drivers);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching drivers", error: error.message });
    }
};

export const getRoutes = async (req: Request, res: Response) => {
    try {
        const routes: IRoute[] = await Route.find();
        res.json(routes);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching routes", error: error.message });
    }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders: IOrder[] = await Order.find().populate('assignedRoute');
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};

export const getSimulations = async (req: Request, res: Response) => {
    try {
        const simulations = await Simulation.find().sort({ timestamp: -1 }).limit(10);
        res.json(simulations);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching simulation history", error: error.message });
    }
};

// --- SIMULATION CONTROLLER ---

export const runSimulation = async (req: Request, res: Response) => {
    try {
        const { numDrivers, maxHours }: { numDrivers: number, maxHours: number } = req.body;

        if (!numDrivers || !maxHours || numDrivers <= 0 || maxHours <= 0) {
            return res.status(400).json({ message: "Number of drivers and max hours must be positive numbers." });
        }

        const availableDrivers: IDriver[] = await Driver.find();
        if (availableDrivers.length < numDrivers) {
            return res.status(400).json({ message: `Simulation requires ${numDrivers} drivers, but only ${availableDrivers.length} are in the database.` });
        }

        const pendingOrders: IOrder[] = await Order.find({ deliveryTimestamp: { $exists: false } }).populate('assignedRoute');
        if (pendingOrders.length === 0) {
            return res.status(400).json({ message: "No pending orders to simulate." });
        }

        let totalProfit = 0;
        let onTimeDeliveries = 0;
        let lateDeliveries = 0;
        const fuelCostBreakdown: { [key: string]: number } = { Low: 0, Medium: 0, High: 0 };

        for (let i = 0; i < pendingOrders.length; i++) {
            const order = pendingOrders[i];
            const driver = availableDrivers[i % numDrivers];
            const route = order.assignedRoute as IRoute; // Assert type after population

            if (!route) continue;

            let deliveryTime = route.baseTime;
            if (driver.isFatigued) {
                deliveryTime *= 1.30;
            }

            const isLate = deliveryTime > (route.baseTime + 10);
            let penalty = isLate ? 50 : 0;
            if (isLate) lateDeliveries++; else onTimeDeliveries++;

            let bonus = (order.value_rs > 1000 && !isLate) ? order.value_rs * 0.10 : 0;

            let fuelCost = route.distance * 5;
            if (route.trafficLevel === 'High') {
                fuelCost += route.distance * 2;
            }
            fuelCostBreakdown[route.trafficLevel] += fuelCost;

            totalProfit += (order.value_rs + bonus - penalty - fuelCost);
        }

        const efficiencyScore = pendingOrders.length > 0 ? (onTimeDeliveries / pendingOrders.length) * 100 : 0;

        const prompt = `You are an expert operations analyst reporting directly to a manager at GreenCart Logistics. Your tone should be professional, concise, and data-driven.

Based on the following raw data from a recent delivery simulation, provide a brief, insightful summary of no more than three sentences.

Start with a direct statement about the overall profitability and efficiency. Then, highlight the single most significant factor (e.g., late delivery penalties, high fuel costs) that impacted the result. Conclude with one clear, actionable recommendation for improvement.

**Simulation Data:**
- Total Profit: Rs. ${totalProfit.toFixed(2)}
- Efficiency Score: ${efficiencyScore.toFixed(2)}%
- On-time Deliveries: ${onTimeDeliveries}
- Late Deliveries: ${lateDeliveries}
- Total Orders Simulated: ${pendingOrders.length}
- Simulation Inputs: ${numDrivers} drivers, max ${maxHours} hours/day.
- Fuel Cost Breakdown by Traffic:
  - Low: Rs. ${fuelCostBreakdown.Low.toFixed(2)}
  - Medium: Rs. ${fuelCostBreakdown.Medium.toFixed(2)}
  - High: Rs. ${fuelCostBreakdown.High.toFixed(2)}

Please provide only the summary text.`;
        const result = await genAI.getGenerativeModel({ model: "gemini-pro" }).generateContent(prompt);
        const aiSummary = result.response.text();

        const newSimulation = new Simulation({
            totalProfit, efficiencyScore, onTimeDeliveries, lateDeliveries, fuelCostBreakdown, aiSummary
        });
        await newSimulation.save();

        res.status(200).json(newSimulation);

    } catch (error: any) {
        console.error("Simulation Error:", error);
        res.status(500).json({ message: 'An error occurred during the simulation.', error: error.message });
    }
};