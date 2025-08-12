import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Driver, IDriver } from '../models';

export const getDrivers = async (req: Request, res: Response) => {
    try {
        const { name, isFatigued } = req.query;
        const filter: any = {};
        if (name) {
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
