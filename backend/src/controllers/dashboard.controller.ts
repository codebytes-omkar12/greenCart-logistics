import { Request, Response } from 'express';
import { Driver, Order, Simulation, IRoute } from '../models'; // Import IRoute

// The getDashboardStats function remains the same...
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


// This is the updated function
export const getChartData = async (req: Request, res: Response) => {
    try {
        const orders = await Order.find().populate('assignedRoute');

        // Data for Bar Chart: Orders per Route
        const ordersPerRoute: { [key: string]: number } = {};
        orders.forEach(order => {
            // This is the corrected check
            const route = order.assignedRoute as IRoute;
            if (route && route.routeID) {
                ordersPerRoute[route.routeID] = (ordersPerRoute[route.routeID] || 0) + 1;
            }
        });

        const barChartData = {
            labels: Object.keys(ordersPerRoute),
            data: Object.values(ordersPerRoute),
        };

        // Data for Pie Chart: Order Status
        let pending = 0;
        let delivered = 0;
        orders.forEach(order => {
            if (order.deliveryTimestamp) {
                delivered++;
            } else {
                pending++;
            }
        });

        const pieChartData = {
            labels: ['Pending', 'Delivered'],
            data: [pending, delivered],
        };

        res.status(200).json({ barChartData, pieChartData });

    } catch (error: any) {
        res.status(500).json({ message: "Error fetching chart data", error: error.message });
    }
};