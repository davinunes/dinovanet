import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { io } from 'socket.io-client';

// Use relative path so it goes through the same domain (Caddy -> Vite -> Proxy -> Backend)
const socket = io({
    path: "/socket.io/",
    transports: ["websocket", "polling"],
});

function TerminalModal({ isOpen, onClose, nodeLabel }) {
    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const fitAddonRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !terminalRef.current) return;

        // Initialize xterm
        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#1e1e1e',
            },
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Initialize server pty
        console.log("Emitting term.init");
        socket.emit('term.init');

        // Handle data from server
        const handleData = (data) => {
            // console.log("Received data:", data); // verbose
            term.write(data);
        };
        socket.on('term.data', handleData);

        // Handle input
        term.onData((data) => {
            console.log("Sending input:", data);
            socket.emit('term.input', data);
        });

        // Handle resize
        const handleResize = () => {
            fitAddon.fit();
            console.log("Resizing term:", term.cols, term.rows);
            socket.emit('term.resize', { cols: term.cols, rows: term.rows });
        };

        window.addEventListener('resize', handleResize);

        // Initial resize to sync server
        setTimeout(handleResize, 100); // Small delay to ensure render

        return () => {
            // Cleanup
            console.log("Cleaning up terminal");
            term.dispose();
            socket.off('term.data', handleData);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden w-3/4 h-3/4 flex flex-col border border-gray-700">
                <div className="bg-gray-800 p-2 flex justify-between items-center px-4 border-b border-gray-700">
                    <span className="text-white font-mono text-sm">Terminal - {nodeLabel}</span>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
                <div className="flex-1 p-2 bg-[#1e1e1e]" ref={terminalRef}></div>
            </div>
        </div>
    );
}

export default TerminalModal;
