import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Driver, Route, Order } from './models';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// --- Define interfaces for the CSV data shapes to satisfy TypeScript ---
interface DriverCsvRow {
    name: string;
    shift_hours: string;
    past_week_hours: string;
}
interface RouteCsvRow {
    route_id: string;
    distance_km: string;
    traffic_level: 'Low' | 'Medium' | 'High';
    base_time_min: string;
}
interface OrderCsvRow {
    order_id: string;
    value_rs: string;
    route_id: string;
}


const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error('FATAL ERROR: MONGO_URI is not defined in .env file.');
        process.exit(1);
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');
    } catch (err: any) {
        console.error(err.message);
        process.exit(1);
    }
};

const seedDatabase = async () => {
    await connectDB();

    try {
        // --- Clear existing data ---
        console.log('Clearing existing data...');
        await Order.deleteMany({});
        await Driver.deleteMany({});
        await Route.deleteMany({});
        console.log('Existing data cleared.');

        // --- Seed Drivers ---
        console.log('Seeding drivers...');
        const driversPath = path.join(__dirname, '..', 'data', 'drivers.csv');
        const driversData: DriverCsvRow[] = [];
        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(driversPath)
                .pipe(csv())
                .on('data', (data: DriverCsvRow) => driversData.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        for (const data of driversData) {
            const driver = new Driver({
                name: data.name,
                currentShiftHours: parseInt(data.shift_hours, 10),
                past7DayWorkHours: data.past_week_hours.split('|').map(Number),
            });
            await driver.save();
        }
        console.log(`${driversData.length} drivers seeded successfully.`);

        // --- Seed Routes ---
        console.log('Seeding routes...');
        const routesPath = path.join(__dirname, '..', 'data', 'routes.csv');
        const routesData: RouteCsvRow[] = [];
        await new Promise<void>((resolve, reject) => {
            fs.createReadStream(routesPath)
                .pipe(csv())
                .on('data', (data: RouteCsvRow) => routesData.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        for (const data of routesData) {
             const route = new Route({
                routeID: data.route_id,
                distance: parseFloat(data.distance_km),
                trafficLevel: data.traffic_level,
                baseTime: parseInt(data.base_time_min, 10)
            });
            await route.save();
        }
        console.log(`${routesData.length} routes seeded successfully.`);

        // --- Seed Orders ---
        console.log('Seeding orders...');
        const routes = await Route.find({});
        const routeMap = new Map(routes.map(r => [r.routeID, r._id]));

        const ordersPath = path.join(__dirname, '..', 'data', 'orders.csv');
        const ordersData: OrderCsvRow[] = [];
         await new Promise<void>((resolve, reject) => {
            fs.createReadStream(ordersPath)
                .pipe(csv())
                .on('data', (data: OrderCsvRow) => ordersData.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        for (const data of ordersData) {
            const routeId = routeMap.get(data.route_id);
            if (routeId) {
                const order = new Order({
                    orderID: data.order_id,
                    value_rs: parseFloat(data.value_rs),
                    assignedRoute: routeId
                });
                await order.save();
            } else {
                console.warn(`Warning: Route ID "${data.route_id}" not found for order "${data.order_id}". Skipping.`);
            }
        }
        console.log(`${ordersData.length} orders processed successfully.`);

        console.log('Database seeding completed!');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
        process.exit();
    }
};

seedDatabase();