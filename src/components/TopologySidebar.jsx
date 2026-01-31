import React, { useState, useEffect } from 'react';

const TopologySidebar = () => {
    const [devices, setDevices] = useState([]);
    const [groups, setGroups] = useState([]);
    const [topologies, setTopologies] = useState([]); // New state
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/devices').then(res => res.json()),
            fetch('/api/groups').then(res => res.json()),
            fetch('/api/topologies').then(res => res.json()) // Fetch topologies
        ]).then(([devicesData, groupsData, topologiesData]) => {
            setDevices(devicesData);
            setGroups(groupsData);
            setTopologies(topologiesData);
        });
    }, []);

    const onDragStart = (event, deviceType, deviceData) => {
        event.dataTransfer.setData('application/reactflow', deviceType);
        event.dataTransfer.setData('application/json', JSON.stringify(deviceData));
        event.dataTransfer.effectAllowed = 'move';
    };

    // Group devices by Client Group
    const groupedDevices = devices.reduce((acc, device) => {
        const groupId = device.groupId || 'uncategorized';
        if (!acc[groupId]) acc[groupId] = [];
        acc[groupId].push(device);
        return acc;
    }, {});

    const getGroupName = (id) => {
        if (id === 'uncategorized') return 'Uncategorized';
        const group = groups.find(g => g.id === id);
        return group ? group.name : 'Unknown Group';
    };

    const filteredGroups = Object.keys(groupedDevices).filter(groupId => {
        if (!searchTerm) return true;
        const groupName = getGroupName(groupId).toLowerCase();
        // Also check if any device in group matches
        const hasMatchingDevice = groupedDevices[groupId].some(d =>
            d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.ip?.includes(searchTerm)
        );
        return groupName.includes(searchTerm.toLowerCase()) || hasMatchingDevice;
    });

    return (
        <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full text-white">
            <div className="p-4 border-b border-gray-800">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Inventory</h2>
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-blue-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {/* Maps / Shortcuts Section */}
                <div className="mb-4">
                    <div className="text-xs font-bold text-blue-400 mb-2 uppercase flex items-center gap-2">
                        Maps (Shortcuts)
                    </div>
                    <div className="space-y-2 pl-2 border-l border-gray-800">
                        {topologies.map(t => (
                            <div
                                key={t.id}
                                className="bg-gray-800 hover:bg-gray-700 p-2 rounded cursor-grab border border-gray-700 hover:border-purple-500 transition-colors text-sm flex items-center gap-2"
                                onDragStart={(event) => onDragStart(event, 'shortcut', {
                                    id: `link-${t.id}`, // Unique ID based on topology
                                    label: t.name,
                                    targetTopologyId: t.id,
                                    type: 'shortcut'
                                })}
                                draggable
                            >
                                <span className="text-purple-400">🔗</span>
                                <span className="font-medium text-gray-200">{t.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Groups Section */}
                {filteredGroups.map(groupId => (
                    <div key={groupId}>
                        <div className="text-xs font-bold text-blue-400 mb-2 uppercase flex items-center gap-2">
                            {getGroupName(groupId)}
                            <span className="text-gray-600 font-normal">({groupedDevices[groupId].length})</span>
                        </div>
                        <div className="space-y-2 pl-2 border-l border-gray-800">
                            {groupedDevices[groupId]
                                .filter(d => !searchTerm || d.description.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(device => (
                                    <div
                                        key={device.id}
                                        className="bg-gray-800 hover:bg-gray-700 p-2 rounded cursor-grab border border-gray-700 hover:border-blue-500 transition-colors text-sm flex flex-col gap-1"
                                        onDragStart={(event) => onDragStart(event, 'device', device)}
                                        draggable
                                    >
                                        <div className="font-medium text-gray-200">{device.description}</div>
                                        <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                                            <span>{device.ip || 'No IP'}</span>
                                            <span className={`px-1 rounded ${device.type === 'cloud' ? 'bg-green-900 text-green-300' : 'bg-gray-700'}`}>
                                                {device.type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
                Drag items to the map to add them to the current topology.
            </div>
        </aside>
    );
};

export default TopologySidebar;
