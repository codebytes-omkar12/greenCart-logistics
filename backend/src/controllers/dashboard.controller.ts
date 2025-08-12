import { Request, Response } from 'express';
import { Driver, Order, Simulation } from '../models';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
       
        const [
            totalDrivers,
            totalOrders,
            pendingOrders,
            simulationResults
        ] = await Promise.all([
            Driver.countDocuments(),
            Order.countDocuments(),
            Order.countDocuments({ deliveryTimestamp: { $exists: false } }),
            Simulation.aggregate([
                {
                    $group: {
                        _id: null,
                        totalProfit: { $sum: '$totalProfit' }
                    }
                }
            ])
        ]);

        // Extract total profit from the aggregation result
        const totalProfit = simulationResults.length > 0 ? simulationResults[0].totalProfit : 0;

        res.status(200).json({
            totalDrivers,
            totalOrders,
            pendingOrders,
            totalProfit
        });

    } catch (error: any) {
        res.status(500).json({ message: "Error fetching dashboard stats", error: error.message });
    }
};