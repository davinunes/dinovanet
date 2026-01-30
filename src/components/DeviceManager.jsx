import React, { useState, useEffect } from 'react';
import DeviceForm from './DeviceForm';

const DeviceManager = ({ isOpen, onClose, onDevicesChanged }) => {
    const [groups, setGroups] = useState([]);
    const [viewMode, setViewMode] = useState('devices'); // 'devices' | 'groups'

    const fetchDevices = () => {
        fetch('/api/devices')
            .then(res => res.json())
            .then(data => setDevices(data))
            .catch(err => console.error(err));
    };

    const fetchGroups = () => {
        fetch('/api/groups')
            .then(res => res.json())
            .then(data => setGroups(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        if (isOpen) {
            fetchDevices();
            fetchGroups();
        }
    }, [isOpen]);

    const handleAdd = () => {
        setEditingDevice(null);
        setIsFormOpen(true);
    };

    const handleEdit = (device) => {
        setEditingDevice(device);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Delete this device?')) {
            fetch(`/api/devices/${id}`, { method: 'DELETE' })
                .then(() => {
                    fetchDevices();
                    if (onDevicesChanged) onDevicesChanged();
                });
        }
    };

    const handleSave = (formData) => {
        const method = editingDevice ? 'PUT' : 'POST';
        const url = editingDevice ? `/api/devices/${editingDevice.id}` : '/api/devices';

        fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(() => {
                setIsFormOpen(false);
                fetchDevices();
                if (onDevicesChanged) onDevicesChanged();
            })
            .catch(err => console.error(err));
    };

    const handleCreateGroup = () => {
        const name = prompt("Enter Client/Group Name:");
        if (name) {
            fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: '' })
            })
                .then(res => res.json())
                .then(() => fetchGroups());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 w-[900px] h-[600px] flex flex-col border border-gray-700 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex gap-4 items-center">
                        <h2 className="text-2xl font-bold text-white">Inventory</h2>
                        <div className="flex bg-gray-800 rounded p-1">
                            <button
                                onClick={() => setViewMode('devices')}
                                className={`px-3 py-1 text-sm rounded ${viewMode === 'devices' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Devices
                            </button>
                            <button
                                onClick={() => setViewMode('groups')}
                                className={`px-3 py-1 text-sm rounded ${viewMode === 'groups' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Clients / Groups
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                {viewMode === 'devices' ? (
                    <>
                        <div className="mb-4">
                            <button
                                onClick={handleAdd}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                            >
                                + Add Device
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto bg-gray-800 rounded border border-gray-700">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-gray-700 text-gray-100 uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="p-3">Client</th>
                                        <th className="p-3">Description</th>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Address</th>
                                        <th className="p-3">Protocol</th>
                                        <th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {devices.map(device => {
                                        const group = (groups || []).find(g => g.id === device.groupId);
                                        return (
                                            <tr key={device.id} className="border-b border-gray-700 hover:bg-gray-750">
                                                <td className="p-3 text-gray-400">{group?.name || '-'}</td>
                                                <td className="p-3 font-medium text-white">{device.description}</td>
                                                <td className="p-3 capitalize">{device.type}</td>
                                                <td className="p-3 font-mono text-gray-400">{device.address || device.ip}</td>
                                                <td className="p-3 uppercase">{device.protocol}</td>
                                                <td className="p-3 text-right space-x-2">
                                                    <button onClick={() => handleEdit(device)} className="text-blue-400 hover:text-blue-300">Edit</button>
                                                    <button onClick={() => handleDelete(device.id)} className="text-red-400 hover:text-red-300">Delete</button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-4">
                            <button
                                onClick={handleCreateGroup}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                            >
                                + Add Client Group
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-800 rounded border border-gray-700">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-gray-700 text-gray-100 uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map(g => (
                                        <tr key={g.id} className="border-b border-gray-700">
                                            <td className="p-3 font-bold text-white">{g.name}</td>
                                            <td className="p-3 font-mono text-xs text-gray-500">{g.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <DeviceForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
                device={editingDevice}
                groups={groups}
            />
        </div>
    );
};

export default DeviceManager;
