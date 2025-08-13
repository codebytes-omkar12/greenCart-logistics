import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { type IDashboardStats, type IChartData } from '../types'; // Import IChartData
import DashboardCharts from '../components/DashboardCharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  // Correctly type the chartData state
  const [chartData, setChartData] = useState<IChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, chartsResponse] = await Promise.all([
          api.getDashboardStats(),
          api.getChartData()
        ]);
        setStats(statsResponse.data);
        setChartData(chartsResponse.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center p-4">Loading dashboard...</div>;
  if (!stats) return <div className="text-center p-4 text-red-500">Could not load dashboard data.</div>;

  return (
    <div>
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg"><h3 className="text-lg font-semibold">Total Drivers</h3><p className="text-3xl">{stats.totalDrivers}</p></div>
          <div className="bg-green-100 p-4 rounded-lg"><h3 className="text-lg font-semibold">Total Orders</h3><p className="text-3xl">{stats.totalOrders}</p></div>
          <div className="bg-yellow-100 p-4 rounded-lg"><h3 className="text-lg font-semibold">Pending Orders</h3><p className="text-3xl">{stats.pendingOrders}</p></div>
          <div className="bg-purple-100 p-4 rounded-lg"><h3 className="text-lg font-semibold">Total Profit</h3><p className="text-3xl">₹{stats.totalProfit.toLocaleString()}</p></div>
        </div>
      </div>
      
      {chartData && (
        <DashboardCharts 
          barChartData={chartData.barChartData} 
          pieChartData={chartData.pieChartData} 
        />
      )}
    </div>
  );
};

export default Dashboard;