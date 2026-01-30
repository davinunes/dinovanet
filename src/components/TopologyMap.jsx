import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import TerminalModal from './TerminalModal';
import ContextMenu from './ContextMenu';
import AssetDetails from './AssetDetails';

import DeviceManager from './DeviceManager';



function TopologyMap() {
    const nodeTypes = useMemo(() => ({}), []);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // State for interactions
    const [terminalNode, setTerminalNode] = useState(null);
    const [detailsNode, setDetailsNode] = useState(null);
    const [menu, setMenu] = useState(null);
    const [isManagerOpen, setIsManagerOpen] = useState(false);

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
        // We need to act optimistic or wait. Let's send the ALL current edges + new one? 
        // Or better, just send the new list from state after update? 
        // React Flow setState is async. The clean way:
        fetch('/api/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([...edges, { ...params, id: `e${params.source}-${params.target}` }]) // Simple naive edge save
        });
    }, [edges, setEdges]); // Depend on edges to save all

    const onNodeContextMenu = useCallback((event, node) => {
        event.preventDefault(); // Prevent native browser menu
        setMenu({
            x: event.clientX,
            y: event.clientY,
            node: node,
        });
    }, []);

    const onPaneClick = useCallback(() => setMenu(null), []);

    const handleMenuAction = (action) => {
        if (!menu) return;
        if (action === 'terminal') {
            setTerminalNode(menu.node);
        } else if (action === 'details') {
            setDetailsNode(menu.node);
        }
    };

    const closeTerminal = () => setTerminalNode(null);
    const closeDetails = () => setDetailsNode(null);
    const closeMenu = () => setMenu(null);

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
                    options={[
                        { label: 'Open Terminal', action: () => handleMenuAction('terminal'), icon: '💻' },
                        { label: 'View Details', action: () => handleMenuAction('details'), icon: 'ℹ️' },
                    ]}
                />
            )}

            <TerminalModal
                isOpen={!!terminalNode}
                onClose={closeTerminal}
                nodeLabel={terminalNode?.data?.label || 'Unknown'}
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
