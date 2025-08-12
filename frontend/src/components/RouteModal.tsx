import React, { useState, useEffect } from 'react';
import { type IRoute } from '../types';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (route: Omit<IRoute, '_id'>) => void;
  routeToEdit: IRoute | null;
}

const RouteModal: React.FC<RouteModalProps> = ({ isOpen, onClose, onSave, routeToEdit }) => {
  const [routeID, setRouteID] = useState('');
  const [distance, setDistance] = useState('');
  const [baseTime, setBaseTime] = useState('');
  const [trafficLevel, setTrafficLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');

  useEffect(() => {
    if (routeToEdit) {
      setRouteID(routeToEdit.routeID);
      setDistance(String(routeToEdit.distance));
      setBaseTime(String(routeToEdit.baseTime));
      setTrafficLevel(routeToEdit.trafficLevel);
    } else {
      setRouteID('');
      setDistance('');
      setBaseTime('');
      setTrafficLevel('Medium');
    }
  }, [routeToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      routeID,
      distance: parseFloat(distance),
      baseTime: parseInt(baseTime, 10),
      trafficLevel,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{routeToEdit ? 'Edit Route' : 'Add New Route'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="routeID" className="block text-sm font-medium text-gray-700">Route ID</label>
            <input type="text" id="routeID" value={routeID} onChange={(e) => setRouteID(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-4">
            <label htmlFor="distance" className="block text-sm font-medium text-gray-700">Distance (km)</label>
            <input type="number" id="distance" value={distance} onChange={(e) => setDistance(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-4">
            <label htmlFor="baseTime" className="block text-sm font-medium text-gray-700">Base Time (min)</label>
            <input type="number" id="baseTime" value={baseTime} onChange={(e) => setBaseTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
          </div>
          <div className="mb-4">
            <label htmlFor="trafficLevel" className="block text-sm font-medium text-gray-700">Traffic Level</label>
            <select id="trafficLevel" value={trafficLevel} onChange={(e) => setTrafficLevel(e.target.value as 'Low' | 'Medium' | 'High')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
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

export default RouteModal;