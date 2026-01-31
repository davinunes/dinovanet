import React, { useState } from 'react';
import TopologyMap from './components/TopologyMap';
import TopologySelector from './components/TopologySelector';
import TopologySidebar from './components/TopologySidebar';
import './App.css';

function App() {
  const [currentTopologyId, setCurrentTopologyId] = useState(null);

  return (
    <div className="App flex flex-col h-screen overflow-hidden bg-gray-900">
      {/* Top Header Bar */}
      <div className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold text-lg tracking-tight">
            <span className="text-blue-500">DINO</span>VANET
          </h1>
          <TopologySelector
            currentTopologyId={currentTopologyId}
            onTopologyChange={setCurrentTopologyId}
          />
        </div>
        <div className="text-xs text-gray-500">
          v0.5.0-alpha
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <TopologySidebar />
        <div className="flex-1 relative">
          <TopologyMap
            topologyId={currentTopologyId}
            onTopologyChange={setCurrentTopologyId}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
