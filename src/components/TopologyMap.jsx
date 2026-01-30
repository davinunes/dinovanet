import React, { useState, useCallback } from 'react';
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

const nodeTypes = {};

function TopologyMap() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // State for interactions
    const [terminalNode, setTerminalNode] = useState(null);
    const [detailsNode, setDetailsNode] = useState(null);
    const [menu, setMenu] = useState(null);

    // Fetch Topology Data
    useEffect(() => {
        fetch('/api/topology')
            .then(res => res.json())
            .then(data => {
                setNodes(data.nodes);
                setEdges(data.edges);
            })
            .catch(err => console.error("Failed to fetch topology:", err));
    }, [setNodes, setEdges]);


    const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

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
        <div style={{ width: '100vw', height: '100vh' }}>
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
        </div>
    );
}

export default TopologyMap;
