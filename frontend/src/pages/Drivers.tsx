import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { type IDriver } from '../types';
import DriverModal from '../components/DriverModal';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<IDriver | null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await api.getDrivers();
      setDrivers(response.data);
    } catch (err) {
      setError('Failed to fetch drivers.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenModal = (driver: IDriver | null = null) => {
    setSelectedDriver(driver);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
  };

  const handleSaveDriver = async (driverData: Omit<IDriver, '_id'>) => {
    try {
      if (selectedDriver) {
        // This is an update
        await api.updateDriver(selectedDriver._id, driverData);
      } else {
        // This is a create
        await api.createDriver(driverData);
      }
      handleCloseModal();
      fetchDrivers(); // Refresh the list
    } catch (err) {
      console.error('Failed to save driver', err);
      alert('Error: Could not save driver.');
    }
  };
  
  const handleDeleteDriver = async (driverId: string) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
        try {
            await api.deleteDriver(driverId);
            fetchDrivers(); // Refresh the list
        } catch (err) {
            console.error('Failed to delete driver', err);
            alert('Error: Could not delete driver.');
        }
    }
  };


  if (loading) return <div className="text-center p-4">Loading drivers...</div>;
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>;

  return (
    <>
      <DriverModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveDriver}
        driverToEdit={selectedDriver}
      />
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Drivers</h2>
          <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Add Driver
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Name</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Shift Hours</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {drivers.map((driver) => (
                <tr key={driver._id} className="border-b">
                  <td className="text-left py-3 px-4">{driver.name}</td>
                  <td className="text-left py-3 px-4">{driver.currentShiftHours}</td>
                  <td className="text-left py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      driver.isFatigued ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                    }`}>
                      {driver.isFatigued ? 'Fatigued' : 'Active'}
                    </span>
                  </td>
                  <td className="text-left py-3 px-4">
                    <button onClick={() => handleOpenModal(driver)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                    <button onClick={() => handleDeleteDriver(driver._id)} className="text-red-600 hover:text-red-900">Delete</button>
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

export default Drivers;