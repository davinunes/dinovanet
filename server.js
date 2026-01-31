import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

import os from 'os';
import pty from 'node-pty';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["https://book.digitalinovation.com.br", "http://localhost:5173"],
        methods: ["GET", "POST"]
    },
    path: "/socket.io/"
});

app.use(express.json());

import { db } from './server_db.js';
import { v4 as uuidv4 } from 'uuid'; // User needs this, I will add to package.json check later or use random string

app.use(express.json());

// --- API Endpoints ---

// Get Topology Data
app.get('/api/topology', async (req, res) => {
    try {
        const topologies = await db.getTopologies();
        // We also need the inventory to hydrate the nodes with fresh data (labels, status, etc.)
        const devices = await db.getDevices();

        let topology;

        if (req.query.id) {
            topology = topologies.find(t => t.id === req.query.id);
        }

        // Default to the first one if not found or not specified
        if (!topology && topologies.length > 0) {
            topology = topologies[0];
        }

        if (!topology) {
            return res.json({ nodes: [], edges: [] });
        }

        // Hydrate nodes with latest device info
        const hydratedNodes = topology.nodes.map(n => {
            const device = devices.find(d => d.id === n.deviceId || d.id === n.id);
            if (device) {
                return {
                    ...n,
                    data: {
                        ...n.data,
                        ...device,
                        label: device.description || device.ip
                    },
                    style: {
                        background: device.type === 'cloud' ? '#6ede87' : '#fff',
                        color: '#333',
                        border: '1px solid #777',
                        padding: '10px',
                        borderRadius: '5px',
                        width: 150,
                        ...n.style // Allow overriding style if needed
                    }
                };
            }
            return n; // device might have been deleted? Return as is or filter out.
        });

        res.json({
            id: topology.id, // Send ID so frontend knows which one it is
            name: topology.name,
            nodes: hydratedNodes,
            edges: topology.edges
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load topology' });
    }
});

// Add Node to Topology
app.post('/api/topology/:id/nodes', async (req, res) => {
    const topologyId = req.params.id === 'default' ? (await db.getTopologies())[0]?.id : req.params.id;
    const newNode = req.body;

    const topologies = await db.getTopologies();
    const topology = topologies.find(t => t.id === topologyId);

    if (topology) {
        // Check if exists
        const existingIdx = topology.nodes.findIndex(n => n.id === newNode.id);
        if (existingIdx !== -1) {
            topology.nodes[existingIdx] = newNode; // Update/Move
        } else {
            topology.nodes.push(newNode); // Add
        }
        await db.saveTopologies(topologies);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Topology not found' });
    }
});

// Devices CRUD
app.get('/api/devices', async (req, res) => {
    const devices = await db.getDevices();
    res.json(devices);
});

app.post('/api/devices', async (req, res) => {
    const devices = await db.getDevices();
    const newDevice = {
        id: uuidv4(),
        ...req.body,
        // No position here anymore, will be added to topology when placed
    };
    devices.push(newDevice);
    await db.saveDevices(devices);
    res.json(newDevice);
});

app.put('/api/devices/:id', async (req, res) => {
    const { id } = req.params;

    // 1. Handle Position Update (belongs to Topology)
    if (req.body.position) {
        const topologies = await db.getTopologies();
        const targetTopologyId = req.body.topologyId;
        let updated = false;

        if (targetTopologyId) {
            // Update ONLY in the specific topology
            const t = topologies.find(topo => topo.id === targetTopologyId || (targetTopologyId === 'default' && topo.id === topologies[0].id));
            if (t) {
                const nodeIndex = t.nodes.findIndex(n => n.id === id);
                if (nodeIndex !== -1) {
                    t.nodes[nodeIndex].position = req.body.position;
                    updated = true;
                }
            }
        } else {
            // Fallback: Update in ALL topologies (Legacy behavior)
            for (const t of topologies) {
                const nodeIndex = t.nodes.findIndex(n => n.id === id);
                if (nodeIndex !== -1) {
                    t.nodes[nodeIndex].position = req.body.position;
                    updated = true;
                }
            }
        }

        if (updated) {
            await db.saveTopologies(topologies);
            return res.json({ success: true, message: "Position updated in topology" });
        }
    }

    // 2. Handle Inventory Update (Description, IP, etc)
    const devices = await db.getDevices();
    const index = devices.findIndex(d => d.id === id);
    if (index !== -1) {
        devices[index] = { ...devices[index], ...req.body };
        // Remove position if it accidentally got sent to inventory
        delete devices[index].position;

        await db.saveDevices(devices);

        // Also update the snapshot in topologies? 
        // Ideally yes, but for MVP we rely on "Data" being in the node.
        // Let's do a quick sync to active topologies
        const topologies = await db.getTopologies();
        let topoChanged = false;
        topologies.forEach(t => {
            t.nodes.forEach(n => {
                if (n.deviceId === id || n.id === id) {
                    n.data = { ...n.data, ...req.body };
                    topoChanged = true;
                }
            });
        });
        if (topoChanged) await db.saveTopologies(topologies);

        res.json(devices[index]);
    } else {
        res.status(404).json({ error: 'Device not found' });
    }
});

app.delete('/api/devices/:id', async (req, res) => {
    let devices = await db.getDevices();
    devices = devices.filter(d => d.id !== req.params.id);
    await db.saveDevices(devices);

    // Also cleanup connections? For now keep simple
    let connections = await db.getConnections();
    connections = connections.filter(c => c.source !== req.params.id && c.target !== req.params.id);
    await db.saveConnections(connections);

    res.json({ success: true });
});

// Connections
// Save all connections (Bulk Replace) - now per Topology
app.post('/api/connections', async (req, res) => {
    // Current MVP frontend just sends the list of edges.
    // We assume this applies to the "Default" or first topology since we don't have ID context yet.
    const connections = req.body;

    const topologies = await db.getTopologies();
    if (topologies.length > 0) {
        // Update the first topology's edges
        topologies[0].edges = connections;
        await db.saveTopologies(topologies);
    }

    await db.saveConnections(connections); // Keep legacy file in sync just in case? Or deprecate.
    res.json({ success: true });
});

app.delete('/api/connections/:id', async (req, res) => {
    const idToDelete = req.params.id;

    const topologies = await db.getTopologies();
    let updated = false;

    // Remove from ALL topologies (safe default)
    topologies.forEach(t => {
        const initialLength = t.edges.length;
        t.edges = t.edges.filter(c => c.id !== idToDelete);
        if (t.edges.length !== initialLength) updated = true;
    });

    if (updated) {
        await db.saveTopologies(topologies);
    }

    // Legacy cleanup
    let oldConnections = await db.getConnections();
    oldConnections = oldConnections.filter(c => c.id !== idToDelete);
    await db.saveConnections(oldConnections);

    res.json({ success: true });
});



// Groups CRUD
app.get('/api/groups', async (req, res) => {
    res.json(await db.getGroups());
});
app.post('/api/groups', async (req, res) => {
    const groups = await db.getGroups();
    const newGroup = { id: uuidv4(), ...req.body };
    groups.push(newGroup);
    await db.saveGroups(groups);
    res.json(newGroup);
});

// Topologies CRUD
app.get('/api/topologies', async (req, res) => {
    res.json(await db.getTopologies());
});
app.post('/api/topologies', async (req, res) => {
    const topologies = await db.getTopologies();
    const newTopology = { id: uuidv4(), ...req.body };
    topologies.push(newTopology);
    await db.saveTopologies(topologies);
    res.json(newTopology);
});

// Legacy Position (for backwards compatibility or specific node update)
app.post('/api/nodes/position', async (req, res) => {
    // Optional: save node positions
    const { id, position } = req.body;
    const devices = await db.getDevices();
    const device = devices.find(d => d.id === id);
    if (device) {
        device.position = position;
        await db.saveDevices(devices);
    }
    res.json({ success: true });
});

const sessions = {};

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("term.init", (payload) => {
        const device = payload?.device;
        let ptyProcess;

        if (device && device.protocol === 'ssh' && device.address) {
            // SSH CONNECTION
            // Warning: StrictHostKeyChecking=no is used for convenience in this MVP.
            // In production, we should handle host keys properly.
            const user = device.username || 'root'; // default user
            const target = `${user}@${device.address}`;
            const cmd = 'ssh';
            const args = ['-o', 'StrictHostKeyChecking=no', target];

            console.log(`Spawning SSH for ${socket.id}: ${cmd} ${args.join(' ')}`);

            ptyProcess = pty.spawn(cmd, args, {
                name: 'xterm-color',
                cols: 80,
                rows: 24,
                cwd: process.env.HOME || process.cwd(),
                env: process.env
            });

        } else {
            // LOCAL SHELL FALLBACK
            const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
            console.log(`Spawning Local Shell for ${socket.id}: ${shell}`);

            ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-color',
                cols: 80,
                rows: 24,
                cwd: process.env.HOME || process.cwd(),
                env: process.env
            });
        }

        sessions[socket.id] = ptyProcess;

        ptyProcess.onData((data) => {
            socket.emit('term.data', data);
        });
    });

    socket.on("term.input", (data) => {
        const ptyProcess = sessions[socket.id];
        if (ptyProcess) {
            ptyProcess.write(data);
        }
    });

    socket.on("term.resize", ({ cols, rows }) => {
        const ptyProcess = sessions[socket.id];
        if (ptyProcess) {
            ptyProcess.resize(cols, rows);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
        const ptyProcess = sessions[socket.id];
        if (ptyProcess) {
            ptyProcess.kill();
            delete sessions[socket.id];
        }
    });
});

const PORT = 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
