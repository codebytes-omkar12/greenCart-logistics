import React, { useState, useEffect } from 'react';
import { type IOrder, type IRoute } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Omit<IOrder, '_id' | 'assignedRoute'> & { assignedRoute: string }) => void;
  orderToEdit: IOrder | null;
  routes: IRoute[]; // Pass the list of routes for the dropdown
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, onSave, orderToEdit, routes }) => {
  const [orderID, setOrderID] = useState('');
  const [value_rs, setValueRs] = useState('');
  const [assignedRoute, setAssignedRoute] = useState('');

  useEffect(() => {
    if (orderToEdit) {
      setOrderID(orderToEdit.orderID);
      setValueRs(String(orderToEdit.value_rs));
      setAssignedRoute(orderToEdit.assignedRoute._id); // Set the route ID
    } else {
      setOrderID('');
      setValueRs('');
      // Set a default route if available
      setAssignedRoute(routes.length > 0 ? routes[0]._id : '');
    }
  }, [orderToEdit, isOpen, routes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedRoute) {
        alert('Please select a route.');
        return;
    }
    onSave({
      orderID,
      value_rs: parseFloat(value_rs),
      assignedRoute, // Pass the selected route ID
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{orderToEdit ? 'Edit Order' : 'Add New Order'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="orderID" className="block text-sm font-medium text-gray-700">Order ID</label>
            <input type="text" id="orderID" value={orderID} onChange={(e) => setOrderID(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-4">
            <label htmlFor="value_rs" className="block text-sm font-medium text-gray-700">Value (₹)</label>
            <input type="number" id="value_rs" value={value_rs} onChange={(e) => setValueRs(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-4">
            <label htmlFor="assignedRoute" className="block text-sm font-medium text-gray-700">Assign to Route</label>
            <select id="assignedRoute" value={assignedRoute} onChange={(e) => setAssignedRoute(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required>
              <option value="" disabled>Select a route</option>
              {routes.map(route => (
                <option key={route._id} value={route._id}>{route.routeID} - {route.distance}km</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;