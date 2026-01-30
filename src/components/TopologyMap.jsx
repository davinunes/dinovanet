import React, { useState, useCallback, useEffect, useMemo } from 'react';
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

function TopologyMap() {
    const nodeTypes = useMemo(() => ({}), []);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // State for interactions
    const [terminalNode, setTerminalNode] = useState(null); // Deprecated but keeping for safety if needed, mostly unused now
    const [detailsNode, setDetailsNode] = useState(null);
    const [menu, setMenu] = useState(null);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

    // Multi-Session State
    const [sessions, setSessions] = useState([]);

    // Fetch Topology Data
    const fetchTopology = useCallback(() => {
        fetch('/api/topology')
            .then(res => res.json())
            .then(data => {
                setNodes(data.nodes);
                setEdges(data.edges);
            })
            .catch(err => console.error("Failed to fetch topology:", err));
    }, [setNodes, setEdges]);

    useEffect(() => {
        fetchTopology();
    }, [fetchTopology]);


    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge(params, eds));
        // Persist connection
        fetch('/api/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([...edges, { ...params, id: `e${params.source}-${params.target}` }]) // Simple naive edge save
        });
    }, [edges, setEdges]);

    const getRelativeCoords = (event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        return {
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top
        };
    };

    const onNodeContextMenu = useCallback((event, node) => {
        event.preventDefault();
        // Note: For Nodes, the event target might be the node element itself or the pane?
        // Actually react flow handles this event. 
        // We want global page coords for fixed position? No, absolute in relative container.

        // Let's rely on the main container ref if possible, or just hack it with event.target
        // Safest is to use the .react-flow__pane or the wrapper div
        // The wrapper div is the parent of the ContextMenu.

        // Since ContextMenu is absolute in the wrapper div:
        // x = event.clientX - wrapperRect.left
        // y = event.clientY - wrapperRect.top

        // We can get the wrapper bounding rect from the event if we assume the wrapper is the currentTarget's closest relative parent?
        // Or simply add a ref to the wrapper div.

        // Let's just fix it by getting the wrapper Ref.
    }, []);
    // Wait, I need to add a Ref to the wrapper div first. 
    // I'll update the component to use a ref.

    const onPaneClick = useCallback(() => setMenu(null), []);

    const handleMenuAction = (action) => {
        if (!menu) return;

        if (action === 'terminal') {
            // Add new session
            const newSession = {
                id: `term-${Date.now()}`,
                nodeLabel: menu.node.data.label || 'Unknown',
                device: menu.node.data,
                isActive: true,
                isMinimized: false,
                isMaximized: false,
                initialX: 50 + (sessions.length * 30),
                initialY: 50 + (sessions.length * 30)
            };
            // Deactivate others and add new
            setSessions(prev => [...prev.map(s => ({ ...s, isActive: false })), newSession]);
        } else if (action === 'details') {
            setDetailsNode(menu.node);
        } else if (action === 'manage') {
            setIsManagerOpen(true);
        }
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
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
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
                onPaneContextMenu={onPaneContextMenu}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
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
                    options={menu.target === 'pane'
                        ? [{ label: 'Manage Devices', action: () => handleMenuAction('manage'), icon: '⚙️' }]
                        : [
                            { label: 'Open Terminal', action: () => handleMenuAction('terminal'), icon: '💻' },
                            { label: 'View Details', action: () => handleMenuAction('details'), icon: 'ℹ️' },
                        ]
                    }
                />
            )}

            {/* Replaced TerminalModal with WindowManager */}
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
