import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models';

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
        if (!password) {
            return res.status(400).json({ message: 'Password is required.' });
        }
        const user: IUser | null = await User.findOne({ username }).select('+password');
        if (!user || !user.password) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        if (user._id) {
            req.session.userId = user._id.toString();
            res.json({ message: 'Logged in successfully.' });
        } else {
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
