import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { type IOrder, type IRoute } from '../types';
import OrderModal from '../components/OrderModal';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [routes, setRoutes] = useState<IRoute[]>([]); // State to hold routes for the dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both orders and routes in parallel
      const [ordersResponse, routesResponse] = await Promise.all([
        api.getOrders(),
        api.getRoutes()
      ]);
      setOrders(ordersResponse.data);
      setRoutes(routesResponse.data);
    } catch (err) {
      setError('Failed to fetch data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (order: IOrder | null = null) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleSaveOrder = async (orderData: Omit<IOrder, '_id' | 'assignedRoute'> & { assignedRoute: string }) => {
    try {
      if (selectedOrder) {
        await api.updateOrder(selectedOrder._id, orderData);
      } else {
        await api.createOrder(orderData);
      }
      handleCloseModal();
      fetchData(); // Refresh the list
    } catch (err) {
      console.error('Failed to save order', err);
      alert('Error: Could not save order.');
    }
  };
  
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
        try {
            await api.deleteOrder(orderId);
            fetchData(); // Refresh the list
        } catch (err) {
            console.error('Failed to delete order', err);
            alert('Error: Could not delete order.');
        }
    }
  };

  if (loading) return <div className="text-center p-4">Loading orders...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <>
      <OrderModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveOrder}
        orderToEdit={selectedOrder}
        routes={routes} // Pass routes to the modal
      />
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Orders</h2>
          <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Add Order
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Order ID</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Value (₹)</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Assigned Route</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {orders.map((order) => (
                <tr key={order._id} className="border-b">
                  <td className="text-left py-3 px-4">{order.orderID}</td>
                  <td className="text-left py-3 px-4">{order.value_rs.toLocaleString()}</td>
                  <td className="text-left py-3 px-4">{order.assignedRoute?.routeID || 'N/A'}</td>
                  <td className="text-left py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      order.deliveryTimestamp ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {order.deliveryTimestamp ? 'Delivered' : 'Pending'}
                    </span>
                  </td>
                  <td className="text-left py-3 px-4">
                    <button onClick={() => handleOpenModal(order)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDeleteOrder(order._id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Orders;