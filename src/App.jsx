import React, { useState, useEffect } from 'react';
import TopologyMap from './components/TopologyMap';
import TopologySelector from './components/TopologySelector';
import TopologySidebar from './components/TopologySidebar';
import Login from './pages/Login';
import './App.css';

function App() {
  const [currentTopologyId, setCurrentTopologyId] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));

  // Intercept fetch to add token
  // Note: This is a simple global side-effect. In a larger app, use a proper Axios instance or fetch wrapper.
  // We'll trust the plan to just use this state for rendering and maybe patch fetch globally or in components?
  // Actually, the plan said "Update API calls".
  // A simple way to ensure all components use the token is to override global fetch or use a context.
  // Let's use a global fetch override for simplicity in this legacy-style app.
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      if (token && resource.toString().startsWith('/api') && !resource.toString().startsWith('/api/login')) {
        config = config || {};
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
        args[1] = config;
      }
      const response = await originalFetch(...args);
      if (response.status === 401 || response.status === 403) {
        setToken(null);
        localStorage.removeItem('auth_token');
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [token]);


  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('auth_token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  if (!token) {
    // Lazy load Login? Or just import it.
    // We need to import Login component.
    return <Login onLogin={handleLogin} />;
  }

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
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">
            v0.5.0-alpha
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400 hover:text-red-300 border border-red-900 p-1 rounded"
          >
            Logout
          </button>
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
