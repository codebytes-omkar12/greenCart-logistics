import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface ChartData {
  labels: string[];
  data: number[];
}

interface DashboardChartsProps {
  barChartData: ChartData;
  pieChartData: ChartData;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ barChartData, pieChartData }) => {
  const barData = {
    labels: barChartData.labels,
    datasets: [{
      label: 'Number of Orders',
      data: barChartData.data,
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }],
  };

  const pieData = {
    labels: pieChartData.labels,
    datasets: [{
      data: pieChartData.data,
      backgroundColor: ['rgba(255, 206, 86, 0.6)', 'rgba(54, 162, 235, 0.6)'],
      borderColor: ['rgba(255, 206, 86, 1)', 'rgba(54, 162, 235, 1)'],
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Orders per Route</h3>
        <div className="relative h-80">
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Order Status</h3>
        <div className="relative h-80">
          <Pie data={pieData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;