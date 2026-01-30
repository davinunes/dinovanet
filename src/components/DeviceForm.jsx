import React, { useState, useEffect } from 'react';

const DeviceForm = ({ isOpen, onClose, onSave, device = null, groups = [] }) => {
    const [formData, setFormData] = useState({
        description: '',
        type: 'server',
        address: '',
        protocol: 'ssh',
        username: '',
        password: '',
        privateKey: ''
    });

    useEffect(() => {
        if (device) {
            setFormData({ ...device });
        } else {
            setFormData({
                description: '',
                type: 'server',
                address: '',
                protocol: 'ssh',
                username: '',
                password: '',
                privateKey: ''
            });
        }
    }, [device, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-96 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">
                    {device ? 'Edit Device' : 'Add New Device'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">Description</label>
                        <input
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                            placeholder="e.g. Web Server Prod"
                            required
                        />
                        required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-xs mb-1">Client Group</label>
                        <select
                            name="groupId"
                            value={formData.groupId || ''}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                        >
                            <option value="">- No Group -</option>
                            {groups && groups.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                            >
                                <option value="server">Server</option>
                                <option value="router">Router</option>
                                <option value="switch">Switch</option>
                                <option value="pc">PC</option>
                                <option value="cloud">Cloud</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Protocol</label>
                            <select
                                name="protocol"
                                value={formData.protocol}
                                onChange={handleChange}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                            >
                                <option value="ssh">SSH</option>
                                <option value="rdp">RDP</option>
                                <option value="vnc">VNC</option>
                                <option value="telnet">Telnet</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">IP / Hostname</label>
                        <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                            placeholder="192.168.1.10"
                            required
                        />
                    </div>

                    <div className="border-t border-gray-700 pt-2 mt-2">
                        <label className="block text-gray-400 text-xs mb-1">Username</label>
                        <input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1 text-gray-400 hover:text-white text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeviceForm;
