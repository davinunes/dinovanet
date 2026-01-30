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

const TerminalModal = ({ isOpen, onClose, nodeLabel, device, isEmbedded = false }) => {
    const terminalRef = useRef(null);
    const socketRef = useRef(null);
    const termRef = useRef(null);
    const fitAddonRef = useRef(null);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        // Create socket
        const socket = io({
            path: "/socket.io/",
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        // Create terminal
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                selectionBackground: 'rgba(255, 255, 255, 0.3)'
            },
            allowProposedApi: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();

        termRef.current = term;
        fitAddonRef.current = fitAddon;

        // Copy on selection
        term.onSelectionChange(() => {
            const selection = term.getSelection();
            if (selection) {
                navigator.clipboard.writeText(selection);
            }
        });

        // Initialize server pty with device info
        socket.emit('term.init', { device });

        // Handle data from server
        const handleData = (data) => {
            term.write(data);
        };
        socket.on('term.data', handleData);

        // Handle input
        term.onData((data) => {
            socket.emit('term.input', data);
        });

        // Handle resize
        const handleResize = () => {
            // Wait for transition if maximizing
            setTimeout(() => {
                if (term.element) {
                    fitAddon.fit();
                    if (term.cols && term.rows) {
                        socket.emit('term.resize', { cols: term.cols, rows: term.rows });
                    }
                }
            }, 50);
        };

        window.addEventListener('resize', handleResize);

        // Initial resize to sync server
        setTimeout(handleResize, 100);

        return () => {
            // Cleanup
            term.dispose();
            socket.off('term.data', handleData);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    // Handle Maximized toggle resize
    useEffect(() => {
        if (!termRef.current || !fitAddonRef.current) return;
        setTimeout(() => {
            fitAddonRef.current.fit();
            const term = termRef.current;
            if (socketRef.current && term.cols && term.rows) {
                socketRef.current.emit('term.resize', { cols: term.cols, rows: term.rows });
            }
        }, 100);
    }, [isMaximized]);

    if (!isOpen) return null;

    const content = (
        <div className={`bg-gray-900 flex flex-col h-full w-full ${!isEmbedded ? 'rounded-lg shadow-xl border border-gray-700 transition-all duration-200' : ''} ${!isEmbedded && isMaximized ? 'fixed inset-0 rounded-none z-[60]' : (!isEmbedded ? 'w-3/4 h-3/4 relative' : '')
            }`}>
            {!isEmbedded && (
                <div className="bg-gray-800 p-2 flex justify-between items-center px-4 border-b border-gray-700 select-none">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-mono text-sm">Terminal - {nodeLabel}</span>
                        {device?.address && <span className="text-gray-500 text-xs">({device.address})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMaximized(!isMaximized)}
                            className="text-gray-400 hover:text-white px-2"
                            title={isMaximized ? "Restore" : "Maximize"}
                        >
                            {isMaximized ? '❐' : '□'}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white px-2"
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* 
               Content Area
            */}
            <div className="flex-1 bg-[#1e1e1e] text-left p-1 overflow-hidden relative">
                <div ref={terminalRef} className="h-full w-full" />
            </div>
        </div>
    );

    if (isEmbedded) return content;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            {content}
        </div>
    );
};

export default TerminalModal;
