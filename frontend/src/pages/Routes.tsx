import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { type IRoute } from '../types';
import RouteModal from '../components/RouteModal';

const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<IRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<IRoute | null>(null);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await api.getRoutes();
      setRoutes(response.data);
    } catch (err) {
      setError('Failed to fetch routes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleOpenModal = (route: IRoute | null = null) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoute(null);
  };

  const handleSaveRoute = async (routeData: Omit<IRoute, '_id'>) => {
    try {
      if (selectedRoute) {
        await api.updateRoute(selectedRoute._id, routeData);
      } else {
        await api.createRoute(routeData);
      }
      handleCloseModal();
      fetchRoutes();
    } catch (err) {
      console.error('Failed to save route', err);
      alert('Error: Could not save route.');
    }
  };
  
  const handleDeleteRoute = async (routeId: string) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
        try {
            await api.deleteRoute(routeId);
            fetchRoutes();
        } catch (err) {
            console.error('Failed to delete route', err);
            alert('Error: Could not delete route.');
        }
    }
  };

  if (loading) return <div className="text-center p-4">Loading routes...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <>
      <RouteModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRoute}
        routeToEdit={selectedRoute}
      />
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Routes</h2>
          <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Add Route
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Route ID</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Distance (km)</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Base Time (min)</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Traffic</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {routes.map((route) => (
                <tr key={route._id} className="border-b">
                  <td className="text-left py-3 px-4">{route.routeID}</td>
                  <td className="text-left py-3 px-4">{route.distance}</td>
                  <td className="text-left py-3 px-4">{route.baseTime}</td>
                  <td className="text-left py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      route.trafficLevel === 'High' ? 'bg-red-200 text-red-800' :
                      route.trafficLevel === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {route.trafficLevel}
                    </span>
                  </td>
                  <td className="text-left py-3 px-4">
                    <button onClick={() => handleOpenModal(route)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDeleteRoute(route._id)} className="text-red-600 hover:text-red-900">Delete</button>
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

export default RoutesPage;