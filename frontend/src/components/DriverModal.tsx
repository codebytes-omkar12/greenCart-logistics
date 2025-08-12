import React, { useState, useEffect } from 'react';
import { type IDriver } from '../types';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (driver: Omit<IDriver, '_id'>) => void;
  driverToEdit: IDriver | null;
}

const DriverModal: React.FC<DriverModalProps> = ({ isOpen, onClose, onSave, driverToEdit }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    // Populate form if we are editing an existing driver
    if (driverToEdit) {
      setName(driverToEdit.name);
    } else {
      // Reset form if we are adding a new one
      setName('');
    }
  }, [driverToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, currentShiftHours: 0, past7DayWorkHours: [], isFatigued: false });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{driverToEdit ? 'Edit Driver' : 'Add New Driver'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="driverName" className="block text-sm font-medium text-gray-700">Driver Name</label>
            <input
              type="text"
              id="driverName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverModal;