import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { type IDashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // You will need to create a backend endpoint for this.
        // For now, using a mock to avoid breaking the UI.
        // const response = await api.getDashboardStats();
        // setStats(response.data);
        setStats({ totalDrivers: 10, totalOrders: 50, pendingOrders: 15, totalProfit: 25000 });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Could not load dashboard data.</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg"><h3 className="text-lg font-semibold">Total Drivers</h3><p className="text-3xl">{stats.totalDrivers}</p></div>
        <div className="bg-green-100 p-4 rounded-lg"><h3 className="text-lg font-semibold">Total Orders</h3><p className="text-3xl">{stats.totalOrders}</p></div>
        <div className="bg-yellow-100 p-4 rounded-lg"><h3 className="text-lg font-semibold">Pending Orders</h3><p className="text-3xl">{stats.pendingOrders}</p></div>
        <div className="bg-purple-100 p-4 rounded-lg"><h3 className="text-lg font-semibold">Total Profit</h3><p className="text-3xl">₹{stats.totalProfit.toLocaleString()}</p></div>
      </div>
    </div>
  );
};

export default Dashboard;