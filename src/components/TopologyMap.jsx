import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ContextMenu from './ContextMenu';
import AssetDetails from './AssetDetails';

import DeviceManager from './DeviceManager';
import WindowManager from './WindowManager';

const nodeTypes = {}; // Define outside to avoid recreation warning
const defaultEdgeOptions = { type: 'smoothstep', style: { strokeWidth: 2, stroke: '#b1b1b7' } };

function TopologyMap({ topologyId }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const containerRef = useRef(null);

    // State for interactions
    const [terminalNode, setTerminalNode] = useState(null);
    const [detailsNode, setDetailsNode] = useState(null);
    const [menu, setMenu] = useState(null);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    // Multi-Session State
    const [sessions, setSessions] = useState([]);

    // Fetch Topology Data
    const fetchTopology = useCallback(() => {
        // If no ID yet (first load), the backend defaults to first, but better to wait?
        // Actually backend handles empty ID gracefully (returns default).
        // But if we passed ID, append it.
        const url = topologyId ? `/api/topology?id=${topologyId}` : '/api/topology';

        fetch(url)
            .then(res => res.json())
            .then(data => {
                // Deduplicate nodes based on ID
                const uniqueNodes = Array.from(new Map(data.nodes.map(n => [n.id, n])).values());
                setNodes(uniqueNodes);
                setEdges(data.edges);
            })
            .catch(err => console.error("Failed to load topology:", err));
    }, [topologyId, setNodes, setEdges]); // Add topologyId dependency

    // Initial Load & Refresh
    useEffect(() => {
        fetchTopology();
    }, [fetchTopology]); // fetchTopology now changes when ID changes

    // Deduplicate edges based on ID to prevent React key errors
    const uniqueEdges = Array.from(new Map(data.edges.map(e => [e.id, e])).values());
    setEdges(uniqueEdges);
})
            .catch (err => console.error("Failed to fetch topology:", err));
    }, [setNodes, setEdges]);

useEffect(() => {
    fetchTopology();
}, [fetchTopology]);


const onConnect = useCallback((params) => {
    // Create a unique ID for the edge to prevent duplicates and ensure stability
    const edgeId = `e${params.source}-${params.target}`;
    const newEdge = {
        ...params,
        id: edgeId,
        type: 'smoothstep', // Better for network diagrams (right angles)
        style: { strokeWidth: 2, stroke: '#555' },
        // If we wanted LACP visual separation, we'd need multiple handles or custom edge.
        // For now, simpler is better as requested.
    };

    setEdges((eds) => {
        const newEdges = addEdge(newEdge, eds);
        // Persist the NEW complete list of edges to ensure backend is in sync
        // Note: In a real app, we should just POST the new edge, but our backend replaces all.
        fetch('/api/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEdges)
        });
        return newEdges;
    });
}, [setEdges]);

// Handle Node Drag Stop - Persist Position
const onNodeDragStop = useCallback((event, node) => {
    fetch(`/api/devices/${node.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: node.position })
    }).catch(err => console.error("Failed to save node position:", err));
}, []);

// Helper to get coordinates relative to the main container
const getRelativeCoords = (event) => {
    if (!containerRef.current) return { x: event.clientX, y: event.clientY };
    const bounds = containerRef.current.getBoundingClientRect();
    return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
    };
};

const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    const coords = getRelativeCoords(event);
    setMenu({
        x: coords.x,
        y: coords.y,
        target: 'node',
        node: node,
    });
}, []);

const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    const coords = getRelativeCoords(event);
    setMenu({
        x: coords.x,
        y: coords.y,
        target: 'edge', // New target type
        edge: edge,     // Pass the edge object
    });
}, []);

const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    const coords = getRelativeCoords(event);
    setMenu({
        x: coords.x,
        y: coords.y,
        target: 'pane',
        node: null,
    });
}, []);

const onPaneClick = useCallback(() => setMenu(null), []);

const handleMenuAction = (action) => {
    if (!menu) return;

    if (action === 'terminal') {
        // Auto-copy password if available
        if (menu.node.data.password) {
            navigator.clipboard.writeText(menu.node.data.password)
                .catch(err => console.error('Failed to copy password:', err));
        }

        // Add new session
        const newSession = {
            id: `term-${Date.now()}`,
            nodeLabel: menu.node.data.label || 'Unknown',
            device: menu.node.data,
            isActive: true, // Auto-focus new window
            isMinimized: false,
            isMaximized: false,
            initialX: 50 + (sessions.length * 30),
            initialY: 50 + (sessions.length * 30),
            type: menu.node.data.protocol === 'rdp' ? 'rdp' : 'ssh'
        };
        // Deactivate others and add new
        setSessions(prev => [...prev.map(s => ({ ...s, isActive: false })), newSession]);
    } else if (action === 'details') {
        setDetailsNode(menu.node);
    } else if (action === 'delete_edge') {
        // Delete connection logic
        const edgeId = menu.edge.id;
        // 1. Update UI
        setEdges(eds => {
            const newEdges = eds.filter(e => e.id !== edgeId);
            // 2. Update Backend
            fetch(`/api/connections/${edgeId}`, { method: 'DELETE' }) // Call the specific delete endpoint
                .catch(err => {
                    console.error("Failed to delete connection:", err);
                    // Optional: Revert UI if failed, but for MVP we assume it works or user refreshes
                    fetch('/api/connections', { // Fallback/Sync: Save the new list if DELETE fails? 
                        // Actually, our DELETE endpoint just needs the ID.
                        // But wait, the backend DELETE deletes by ID.
                        // If we want to be robust with the "bulk save" legacy:
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newEdges)
                    });
                });
            return newEdges;
        });
    } else if (action === 'manage') {
        setIsManagerOpen(true);
    }
    setMenu(null); // Close menu after action
};

const closeDetails = () => setDetailsNode(null);
const closeMenu = () => setMenu(null);

// Window Manager Handlers
const handleUpdateSession = (id, updates) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
};

const handleCloseSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id));
};

const handleFocusSession = (id) => {
    setSessions(prev => prev.map(s => ({ ...s, isActive: s.id === id })));
};

return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        {/* Admin Controls */}
        <div className="absolute top-4 right-4 z-40">
            <button
                onClick={() => setIsManagerOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow-lg border border-blue-400 font-bold text-sm transition-all transform hover:scale-105"
            >
                ⚙️ Manage Devices
            </button>
        </div>

        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onNodeDragStop={onNodeDragStop}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
        >
            <Background />
            <Controls />
        </ReactFlow>

        {menu && (
            <ContextMenu
                x={menu.x}
                y={menu.y}
                onClose={closeMenu}
                options={
                    menu.target === 'node' ? [
                        { label: 'Open Terminal', action: () => handleMenuAction('terminal'), icon: '💻' },
                        { label: 'View Details', action: () => handleMenuAction('details'), icon: 'ℹ️' },
                    ] :
                        menu.target === 'edge' ? [
                            { label: 'Delete Connection', action: () => handleMenuAction('delete_edge'), icon: '🗑️' }
                        ] :
                            [
                                { label: 'Manage Devices', action: () => handleMenuAction('manage'), icon: '⚙️' }
                            ]
                }
            />
        )}

        <WindowManager
            sessions={sessions}
            onUpdateSession={handleUpdateSession}
            onCloseSession={handleCloseSession}
            onFocusSession={handleFocusSession}
        />

        <AssetDetails
            isOpen={!!detailsNode}
            onClose={closeDetails}
            node={detailsNode}
        />

        <DeviceManager
            isOpen={isManagerOpen}
            onClose={() => setIsManagerOpen(false)}
            onDevicesChanged={fetchTopology}
        />
    </div>
);
}

export default TopologyMap;
