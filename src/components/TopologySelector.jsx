import React, { useState, useEffect } from 'react';

const TopologySelector = ({ currentTopologyId, onTopologyChange }) => {
    const [topologies, setTopologies] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTopoName, setNewTopoName] = useState('');

    const fetchTopologies = () => {
        fetch('/api/topologies')
            .then(res => res.json())
            .then(data => {
                setTopologies(data);
                // If current ID is invalid/empty and we have data, select first
                if (!currentTopologyId && data.length > 0) {
                    onTopologyChange(data[0].id);
                }
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchTopologies();
    }, []);

    const handleCreate = () => {
        if (!newTopoName) return;

        fetch('/api/topologies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newTopoName,
                description: 'New topology',
                nodes: [],
                edges: []
            })
        })
            .then(res => res.json())
            .then(newTopo => {
                setTopologies(prev => [...prev, newTopo]);
                onTopologyChange(newTopo.id);
                setNewTopoName('');
                setIsCreating(false);
            });
    };

    return (
        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded border border-gray-600 shadow-md">
            <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Map:</span>

            <select
                value={currentTopologyId || ''}
                onChange={(e) => onTopologyChange(e.target.value)}
                className="bg-gray-900 text-white text-sm border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500"
            >
                {topologies.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>

            {isCreating ? (
                <div className="flex items-center gap-1 animate-fadeIn">
                    <input
                        className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 w-32"
                        placeholder="New Map Name"
                        value={newTopoName}
                        onChange={e => setNewTopoName(e.target.value)}
                    />
                    <button onClick={handleCreate} className="text-green-400 hover:text-green-300 text-xs">✔</button>
                    <button onClick={() => setIsCreating(false)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                </div>
            ) : (
                <button
                    onClick={() => setIsCreating(true)}
                    className="ml-2 text-gray-400 hover:text-white text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                >
                    + New
                </button>
            )}
        </div>
    );
};

export default TopologySelector;
