import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Order, IOrder } from '../models';

export const getOrders = async (req: Request, res: Response) => {
    try {
        const { orderID, hasBeenDelivered } = req.query;
        const filter: any = {};
        if (orderID) {
            filter.orderID = { $regex: orderID, $options: 'i' };
        }
        if (hasBeenDelivered) {
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
