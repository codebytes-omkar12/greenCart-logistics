import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { type ISimulation } from '../types';
import SimulationResult from '../components/SimulationResult';

const Simulations: React.FC = () => {
  const [simulations, setSimulations] = useState<ISimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [numDrivers, setNumDrivers] = useState('5');
  const [maxHours, setMaxHours] = useState('8');
  const [startTime, setStartTime] = useState('09:00');
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchSimulations = async () => {
    setLoading(true);
    try {
      const response = await api.getSimulations();
      setSimulations(response.data);
    } catch (err) {
      setError('Failed to fetch simulations.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, []);

 const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const params = {
        numDrivers: parseInt(numDrivers, 10),
        maxHours: parseInt(maxHours, 10),
        startTime,
      };
      await api.runSimulation(params);
      fetchSimulations(); 
    } catch (err: any) {
      console.error('Failed to run simulation', err);
      // Check for a specific message from the backend, otherwise show a generic one.
      const errorMessage = err.response?.data?.message || 'An unknown error occurred.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSimulating(false);
    }
  };
 const handleDeleteSimulation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this simulation record?')) {
      try {
        await api.deleteSimulation(id);
        fetchSimulations(); // Refresh the list
      } catch (err) {
        console.error('Failed to delete simulation', err);
        alert('Error: Could not delete the simulation.');
      }
    }
  };
   const handleSummaryUpdate = (updatedSimulation: ISimulation) => {
    setSimulations(currentSimulations => 
      currentSimulations.map(sim => 
        sim._id === updatedSimulation._id ? updatedSimulation : sim
      )
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Column 1: Simulation Controls */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Run New Simulation</h2>
          <form onSubmit={handleRunSimulation}>
            <div className="mb-4">
              <label htmlFor="numDrivers" className="block text-sm font-medium text-gray-700">Number of Drivers</label>
              <input type="number" id="numDrivers" value={numDrivers} onChange={e => setNumDrivers(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="mb-4">
              <label htmlFor="maxHours" className="block text-sm font-medium text-gray-700">Max Shift Hours</label>
              <input type="number" id="maxHours" value={maxHours} onChange={e => setMaxHours(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div className="mb-4">
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
              <input type="time" id="startTime" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <button type="submit" disabled={isSimulating} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300">
              {isSimulating ? 'Simulating...' : 'Run Simulation'}
            </button>
          </form>
        </div>
      </div>

      {/* Column 2: Simulation History */}
       <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Simulation History</h2>
            
          </div>
          {loading && <p>Loading history...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="space-y-4">
              {simulations.length > 0 ? (
                simulations.map(sim => 
                  <SimulationResult 
                    key={sim._id} 
                    simulation={sim} 
                    onDelete={handleDeleteSimulation}
                    onSummaryGenerated={handleSummaryUpdate} // Pass the handler down
                  />
                )
              ) : (
                <p>No past simulations found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulations;