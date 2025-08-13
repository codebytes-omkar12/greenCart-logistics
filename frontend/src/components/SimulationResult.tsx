import React, { useState } from 'react';
import { type ISimulation } from '../types';
import { api } from '../api';

interface SimulationResultProps {
  simulation: ISimulation;
  onDelete: (id: string) => void;
  onSummaryGenerated: (updatedSimulation: ISimulation) => void; // Add this prop
}

const SimulationResult: React.FC<SimulationResultProps> = ({ simulation, onDelete, onSummaryGenerated }) => {
  // No longer needs its own state, it will just use the prop
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const handleGenerateSummary = async () => {
    if (simulation.aiSummary) return;

    setIsLoadingSummary(true);
    try {
      const response = await api.generateAiSummary(simulation._id);
      // Create the updated simulation object
      const updatedSimulation = {
        ...simulation,
        aiSummary: response.data.summary,
        tags: response.data.tags,
      };
      // Pass the new data up to the parent component
      onSummaryGenerated(updatedSimulation);
    } catch (error) {
      console.error("Failed to generate AI summary", error);
      alert("Could not generate AI summary. The request may have timed out.");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // The rest of the JSX remains the same...
  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative">
      <button
        onClick={() => onDelete(simulation._id)}
        className="absolute top-2 right-2 p-1 text-gray-400 bg-transparent rounded-full hover:bg-red-100 hover:text-red-600"
        title="Delete this simulation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex justify-between items-center mb-2 pr-8">
        <h3 className="font-semibold text-lg">
          Simulation from {new Date(simulation.timestamp).toLocaleString()}
        </h3>
        <span className={`text-lg font-bold ${simulation.totalProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
          Profit: ₹{simulation.totalProfit.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center mb-4">
        <div>
          <p className="text-sm text-gray-500">Efficiency</p>
          <p className="font-semibold text-xl">{simulation.efficiencyScore.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">On-Time</p>
          <p className="font-semibold text-xl">{simulation.onTimeDeliveries}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Late</p>
          <p className="font-semibold text-xl">{simulation.lateDeliveries}</p>
        </div>
      </div>

      {simulation.aiSummary ? (
        <div className="bg-indigo-50 p-3 rounded-md">
          <p className="font-semibold text-indigo-800">AI Summary:</p>
          <p className="text-sm text-indigo-700 italic">{simulation.aiSummary}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {simulation.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-indigo-200 text-indigo-800 text-xs rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-right">
            <button
              onClick={handleGenerateSummary}
              disabled={isLoadingSummary}
              className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isLoadingSummary ? '...' : 'AI Summary'}
            </button>
        </div>
      )}
    </div>
  );
};

export default SimulationResult;