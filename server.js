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

// Get consolidated Topology (Nodes + Edges)
app.get('/api/topology', async (req, res) => {
    try {
        const devices = await db.getDevices();
        const connections = await db.getConnections();

        // Map devices to React Flow nodes
        const nodes = devices.map(d => ({
            id: d.id,
            // If position is saved in device, use it, else default (random or layout needed later)
            position: d.position || { x: Math.random() * 500, y: Math.random() * 500 },
            data: { ...d, label: d.description || d.ip }, // Spread all device props to data
            style: {
                background: d.type === 'cloud' ? '#6ede87' : '#fff',
                color: '#333',
                border: '1px solid #777',
                padding: '10px',
                borderRadius: '5px',
                width: 150
            }
        }));

        res.json({ nodes, edges: connections });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load topology' });
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
        position: { x: 100, y: 100 } // Default spawn
    };
    devices.push(newDevice);
    await db.saveDevices(devices);
    res.json(newDevice);
});

app.put('/api/devices/:id', async (req, res) => {
    const devices = await db.getDevices();
    const index = devices.findIndex(d => d.id === req.params.id);
    if (index !== -1) {
        devices[index] = { ...devices[index], ...req.body };
        await db.saveDevices(devices);
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
// Save all connections (Bulk Replace)
app.post('/api/connections', async (req, res) => {
    const connections = req.body; // Expects array of edges
    await db.saveConnections(connections);
    res.json({ success: true });
});

app.delete('/api/connections/:id', async (req, res) => {
    let connections = await db.getConnections();
    const idToDelete = req.params.id;
    // Filter out the connection with the given ID
    connections = connections.filter(c => c.id !== idToDelete);
    await db.saveConnections(connections);
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
