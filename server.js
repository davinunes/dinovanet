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

// Mock Topology Data
const topologyData = {
    nodes: [
        {
            id: '1',
            data: { label: 'Internet', type: 'cloud', ip: '8.8.8.8' },
            position: { x: 250, y: 5 },
            style: { background: '#6ede87', color: '#333' },
        },
        {
            id: '2',
            data: { label: 'Caddy Proxy (Portainer)', type: 'server', ip: '192.168.1.10', os: 'Linux' },
            position: { x: 100, y: 100 },
        },
        {
            id: '3',
            data: { label: 'Network Manager (App)', type: 'server', ip: '192.168.1.20', os: 'Linux' },
            position: { x: 400, y: 100 },
        },
    ],
    edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e1-3', source: '1', target: '3', animated: true },
    ]
};

app.get('/api/topology', (req, res) => {
    res.json(topologyData);
});

const sessions = {};

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("term.init", () => {
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME || process.cwd(),
            env: process.env
        });

        sessions[socket.id] = ptyProcess;

        ptyProcess.onData((data) => {
            socket.emit('term.data', data);
        });

        console.log(`PTY spawned for ${socket.id}: ${shell}`);
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
