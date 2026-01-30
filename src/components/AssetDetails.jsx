import React from 'react';

const AssetDetails = ({ isOpen, onClose, node }) => {
    if (!isOpen || !node) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg shadow-xl p-6 w-96 border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white max-w-[80%] truncate" title={node.data.label}>
                        {node.data.label}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-3 text-gray-300">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <span className="font-semibold text-gray-400">ID:</span>
                        <span className="col-span-2 font-mono bg-gray-800 px-1 rounded">{node.id}</span>

                        <span className="font-semibold text-gray-400">Type:</span>
                        <span className="col-span-2 capitalize">{node.data.type || 'Unknown'}</span>

                        <span className="font-semibold text-gray-400">IP / Address:</span>
                        <span className="col-span-2 font-mono">{node.data.address || node.data.ip || 'N/A'}</span>

                        {node.data.os && (
                            <>
                                <span className="font-semibold text-gray-400">OS:</span>
                                <span className="col-span-2">{node.data.os}</span>
                            </>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-400 mb-2">JSON Data</h3>
                        <pre className="bg-gray-800 p-2 rounded text-xs overflow-auto max-h-32 text-green-400">
                            {JSON.stringify(node.data, null, 2)}
                        </pre>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssetDetails;
