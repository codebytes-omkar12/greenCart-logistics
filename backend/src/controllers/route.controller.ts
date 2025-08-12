import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Route, IRoute } from '../models';

export const getRoutes = async (req: Request, res: Response) => {
    try {
        const { routeID, trafficLevel } = req.query;
        const filter: any = {};
        if (routeID) {
            filter.routeID = { $regex: routeID, $options: 'i' };
        }
        if (trafficLevel && ['Low', 'Medium', 'High'].includes(trafficLevel as string)) {
            filter.trafficLevel = trafficLevel;
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
