import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';

// Import all controllers
import * as controllers from './controllers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- MIDDLEWARE SETUP ---
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
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

declare module 'express-session' {
    interface SessionData {
        userId: string;
    }
}

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI!)
    .then(() => console.log('MongoDB Connected Successfully...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- AUTHENTICATION MIDDLEWARE ---
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ message: 'Unauthorized. Please log in.' });
    }
};

// --- API ROUTES ---

// Auth Routes
app.post('/api/register', controllers.registerUser);
app.post('/api/login', controllers.loginUser);
app.post('/api/logout', controllers.logoutUser);
app.get('/api/auth/status', controllers.getAuthStatus);

// --- FULL CRUD Routes ---

// Drivers
app.post('/api/drivers', requireAuth, controllers.createDriver);
app.get('/api/drivers', requireAuth, controllers.getDrivers);
app.put('/api/drivers/:id', requireAuth, controllers.updateDriver);
app.delete('/api/drivers/:id', requireAuth, controllers.deleteDriver);

// Routes
app.post('/api/routes', requireAuth, controllers.createRoute);
app.get('/api/routes', requireAuth, controllers.getRoutes);
app.put('/api/routes/:id', requireAuth, controllers.updateRoute);
app.delete('/api/routes/:id', requireAuth, controllers.deleteRoute);

// Orders
app.post('/api/orders', requireAuth, controllers.createOrder);
app.get('/api/orders', requireAuth, controllers.getOrders);
app.put('/api/orders/:id', requireAuth, controllers.updateOrder);
app.delete('/api/orders/:id', requireAuth, controllers.deleteOrder);


// --- SIMULATION Routes ---
app.get('/api/simulations', requireAuth, controllers.getSimulations);
app.post('/api/simulate', requireAuth, controllers.runSimulation);
app.post('/api/simulations/:id/generate-summary', requireAuth, controllers.generateAiSummary);

// --- SERVER START & EXPORT ---
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));

export default app;