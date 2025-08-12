import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import cors from 'cors';


// --- UPDATED: Use named imports for clarity and to resolve the error ---
import { registerUser, loginUser, logoutUser, getAuthStatus } from './controllers/auth.controller';
import { createDriver, getDrivers, updateDriver, deleteDriver } from './controllers/driver.controller';
import { createRoute, getRoutes, updateRoute, deleteRoute } from './controllers/route.controller';
import { createOrder, getOrders, updateOrder, deleteOrder } from './controllers/order.controller';
import { getSimulations, runSimulation, generateAiSummary } from './controllers/simulation.controller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'a_very_secret_key_for_development',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

declare module 'express-session' {
    interface SessionData {
        userId: string;
    }
}

// --- DATABASE CONNECTION 
mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log('MongoDB Connected Successfully...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- AUTHENTICATION MIDDLEWARE 
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
};

// --- API ROUTES 

// Auth Routes
app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.post('/api/logout', logoutUser);
app.get('/api/auth/status', getAuthStatus);

// Driver Routes
app.post('/api/drivers', requireAuth, createDriver);
app.get('/api/drivers', requireAuth, getDrivers);
app.put('/api/drivers/:id', requireAuth, updateDriver);
app.delete('/api/drivers/:id', requireAuth, deleteDriver);

// Route Routes
app.post('/api/routes', requireAuth, createRoute);
app.get('/api/routes', requireAuth, getRoutes);
app.put('/api/routes/:id', requireAuth, updateRoute);
app.delete('/api/routes/:id', requireAuth, deleteRoute);

// Order Routes
app.post('/api/orders', requireAuth, createOrder);
app.get('/api/orders', requireAuth, getOrders);
app.put('/api/orders/:id', requireAuth, updateOrder);
app.delete('/api/orders/:id', requireAuth, deleteOrder);

// Simulation Routes
app.get('/api/simulations', requireAuth, getSimulations);
app.post('/api/simulate', requireAuth, runSimulation);
app.post('/api/simulations/:id/generate-summary', requireAuth, generateAiSummary);


// --- SERVER START & EXPORT 
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));

export default app;
