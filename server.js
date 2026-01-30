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
