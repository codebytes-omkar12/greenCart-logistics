import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isValidObjectId } from 'mongoose';


import {
    User, Driver, Route, Order, Simulation,
    IUser, IDriver, IRoute, IOrder,ISimulation
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

// DRIVERS

export const getDrivers = async (req: Request, res: Response) => {
    try {
        const { name, isFatigued } = req.query;
        const filter: any = {};

        if (name) {
            // Use regex for case-insensitive partial matching
            filter.name = { $regex: name, $options: 'i' };
        }
        if (isFatigued) {
            filter.isFatigued = isFatigued === 'true';
        }

        const drivers: IDriver[] = await Driver.find(filter);
        res.json(drivers);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching drivers", error: error.message });
    }
};
export const createDriver = async (req: Request, res: Response) => {
    try {
        const { name, past7DayWorkHours, isFatigued } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Driver name is required.' });
        }
        const newDriver = new Driver({ name, past7DayWorkHours, isFatigued });
        await newDriver.save();
        res.status(201).json(newDriver);
    } catch (error: any) {
        res.status(500).json({ message: 'Error creating driver', error: error.message });
    }
};

export const updateDriver = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid driver ID.' });
        }
        const updatedDriver = await Driver.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedDriver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }
        res.json(updatedDriver);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating driver', error: error.message });
    }
};

export const deleteDriver = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid driver ID.' });
        }
        const deletedDriver = await Driver.findByIdAndDelete(id);
        if (!deletedDriver) {
            return res.status(404).json({ message: 'Driver not found.' });
        }
        res.json({ message: 'Driver deleted successfully.' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting driver', error: error.message });
    }
};

// ROUTES

export const getRoutes = async (req: Request, res: Response) => {
    try {
        const { routeID, trafficLevel } = req.query;
        const filter: any = {};

        if (routeID) {
            filter.routeID = { $regex: routeID, $options: 'i' };
        }
        if (trafficLevel) {
            // Ensure it's one of the allowed enum values
            if (['Low', 'Medium', 'High'].includes(trafficLevel as string)) {
                filter.trafficLevel = trafficLevel;
            }
        }

        const routes: IRoute[] = await Route.find(filter);
        res.json(routes);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching routes", error: error.message });
    }
};
export const createRoute = async (req: Request, res: Response) => {
    try {
        const newRoute = new Route(req.body);
        await newRoute.save();
        res.status(201).json(newRoute);
    } catch (error: any) {
        res.status(500).json({ message: 'Error creating route', error: error.message });
    }
};

export const updateRoute = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid route ID.' });
        const updatedRoute = await Route.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedRoute) return res.status(404).json({ message: 'Route not found.' });
        res.json(updatedRoute);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating route', error: error.message });
    }
};

export const deleteRoute = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid route ID.' });
        const deletedRoute = await Route.findByIdAndDelete(id);
        if (!deletedRoute) return res.status(404).json({ message: 'Route not found.' });
        res.json({ message: 'Route deleted successfully.' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting route', error: error.message });
    }
};

// ORDERS

export const getOrders = async (req: Request, res: Response) => {
    try {
        const { orderID, hasBeenDelivered } = req.query;
        const filter: any = {};

        if (orderID) {
            filter.orderID = { $regex: orderID, $options: 'i' };
        }
        if (hasBeenDelivered) {
            // Search for orders that either have a delivery timestamp or don't
            filter.deliveryTimestamp = { $exists: hasBeenDelivered === 'true' };
        }

        const orders: IOrder[] = await Order.find(filter).populate('assignedRoute');
        res.json(orders);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};
export const createOrder = async (req: Request, res: Response) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error: any) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

export const updateOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid order ID.' });
        const updatedOrder = await Order.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedOrder) return res.status(404).json({ message: 'Order not found.' });
        res.json(updatedOrder);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
};

export const deleteOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid order ID.' });
        const deletedOrder = await Order.findByIdAndDelete(id);
        if (!deletedOrder) return res.status(404).json({ message: 'Order not found.' });
        res.json({ message: 'Order deleted successfully.' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error deleting order', error: error.message });
    }
};

export const getSimulations = async (req: Request, res: Response) => {
    // No filtering needed for simulations for now
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
        const { numDrivers, maxHours, startTime } = req.body;

        if (!numDrivers || !maxHours || !startTime || numDrivers <= 0 || maxHours <= 0) {
            return res.status(400).json({ message: "Number of drivers, max hours, and start time are required and must be positive." });
        }
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
            return res.status(400).json({ message: 'Invalid start time format. Please use HH:MM.' });
        }

        const availableDrivers: IDriver[] = await Driver.find().limit(numDrivers);
        if (availableDrivers.length < numDrivers) {
            return res.status(400).json({ message: `Simulation requires ${numDrivers} drivers, but only ${availableDrivers.length} are in the database.` });
        }

        const pendingOrders: IOrder[] = await Order.find({ deliveryTimestamp: { $exists: false } }).populate('assignedRoute');
        if (pendingOrders.length === 0) {
            return res.status(400).json({ message: "No pending orders to simulate." });
        }

        const dailyWorkLog = new Map<string, number>();
        availableDrivers.forEach(driver => {
            // --- FIX 1: Add a check for driver._id ---
            if (driver._id) {
                dailyWorkLog.set(driver._id.toString(), 0);
            }
        });

        let totalProfit = 0;
        let onTimeDeliveries = 0;
        let lateDeliveries = 0;
        const fuelCostBreakdown: { [key: string]: number } = { Low: 0, Medium: 0, High: 0 };

        for (let i = 0; i < pendingOrders.length; i++) {
            const order = pendingOrders[i];
            const driver = availableDrivers[i % numDrivers];
            const route = order.assignedRoute as IRoute;

            // --- FIX 2: Add a check before using driver._id in the loop ---
            if (!route || !driver._id) continue;

            let deliveryTime = route.baseTime;
            if (driver.isFatigued) {
                deliveryTime *= 1.30;
            }

            const deliveryHours = deliveryTime / 60;
            const currentHours = dailyWorkLog.get(driver._id.toString()) || 0;
            
            if (currentHours + deliveryHours <= maxHours) {
                dailyWorkLog.set(driver._id.toString(), currentHours + deliveryHours);

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
        }

        const efficiencyScore = pendingOrders.length > 0 ? (onTimeDeliveries / pendingOrders.length) * 100 : 0;

        for (const driver of availableDrivers) {
            // --- FIX 3: Add a final check before saving ---
            if (!driver._id) continue;

            const hoursWorked = dailyWorkLog.get(driver._id.toString()) || 0;
            driver.isFatigued = hoursWorked > 8;
            
            driver.past7DayWorkHours.shift();
            driver.past7DayWorkHours.push(hoursWorked);
            
            await driver.save();
        }

        const newSimulation = new Simulation({
            totalProfit, efficiencyScore, onTimeDeliveries, lateDeliveries, fuelCostBreakdown
        });
        await newSimulation.save();

        res.status(201).json(newSimulation);

    } catch (error: any) {
        console.error("Simulation Error:", error);
        res.status(500).json({ message: 'An error occurred during the simulation.', error: error.message });
    }
};

// AI SUMMARY END POINT
export const generateAiSummary = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const simulation: ISimulation | null = await Simulation.findById(id);

        if (!simulation) {
            return res.status(404).json({ message: 'Simulation not found.' });
        }

        // If summary and tags already exist, stream the summary back
        if (simulation.aiSummary && simulation.tags.length > 0) {
            return streamText(res, simulation.aiSummary);
        }

        // --- UPDATED PROMPT ---
        // This prompt now asks for a specific JSON structure.
        const prompt = `You are an expert operations analyst for GreenCart Logistics.
                Analyze the following simulation data and return a JSON object with two keys: "summary" and "tags".

                **Rules for "summary"**:
                - A professional, concise summary (max 3 sentences).
                - Start with profitability and efficiency.
                - Highlight the single most significant factor.
                - Conclude with one actionable recommendation.

                **Rules for "tags"**:
                - An array of 3-5 short, descriptive strings.
                - Tags should reflect the key outcomes (e.g., "High Profit", "Poor Efficiency", "High Fuel Costs", "On-Time Success").

                **Simulation Data:**
                - Total Profit: Rs. ${simulation.totalProfit.toFixed(2)}
                - Efficiency Score: ${simulation.efficiencyScore.toFixed(2)}%
                - On-time Deliveries: ${simulation.onTimeDeliveries}
                - Late Deliveries: ${simulation.lateDeliveries}

                **Return only the raw JSON object.**`;
        
        const result = await genAI.getGenerativeModel({ model: "gemini-pro" }).generateContent(prompt);
        const responseText = result.response.text();

        // --- PARSE THE JSON RESPONSE ---
        const aiResponse = JSON.parse(responseText);
        const { summary, tags } = aiResponse;

        if (!summary || !tags) {
            throw new Error("AI response did not contain summary or tags.");
        }

        // Save both summary and tags to the database
        simulation.aiSummary = summary;
        simulation.tags = tags;
        await simulation.save();
        
        // Stream only the summary text for the typing effect
        streamText(res, summary);

    } catch (error: any) {
        console.error("AI Summary/Tag Generation Error:", error);
        res.status(500).json({ message: 'Failed to generate AI content.' });
    }
};

// Helper function to handle the streaming logic
const streamText = (res: Response, text: string) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const words = text.split(' ');
    let wordIndex = 0;

    const intervalId = setInterval(() => {
        if (wordIndex < words.length) {
            res.write(words[wordIndex] + ' ');
            wordIndex++;
        } else {
            clearInterval(intervalId);
            res.end();
        }
    }, 120); // Typing speed

    res.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
};