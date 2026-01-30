import React from 'react';
import WindowFrame from './WindowFrame';
import TerminalModal from './TerminalModal'; // We will reuse the internal logic of TerminalModal

const WindowManager = ({ sessions, onUpdateSession, onCloseSession, onFocusSession }) => {

    // Sort to handle z-index visually if we mapped properly, 
    // but standard mapping order + z-index manipulation in WindowFrame style is better.
    // For now we just render all, and `isActive` prop controls the z-index class.

    return (
        <>
            {/* Windows Layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {sessions.map(session => (
                    // We hide minimized windows but keep them mounted to preserve socket
                    <div key={session.id} className={session.isMinimized ? 'hidden' : 'contents pointer-events-auto'}>
                        <WindowFrame
                            id={session.id}
                            title={`Terminal - ${session.nodeLabel}`}
                            isActive={session.isActive}
                            isMaximized={session.isMaximized}
                            onFocus={() => onFocusSession(session.id)}
                            onClose={() => onCloseSession(session.id)}
                            onMinimize={() => onUpdateSession(session.id, { isMinimized: true, isActive: false })}
                            onMaximizeToggle={() => onUpdateSession(session.id, { isMaximized: !session.isMaximized })}
                            initialX={session.initialX}
                            initialY={session.initialY}
                        >
                            {/* Reuse TerminalModal content logic, we need to adapt TerminalModal to be headless or purely content */}
                            <TerminalModal
                                isOpen={true}
                                onClose={() => onCloseSession(session.id)} // Redundant but prop required
                                nodeLabel={session.nodeLabel}
                                device={session.device}
                                isEmbedded={true} // New prop to tell it to skip the modal wrapper
                            />
                        </WindowFrame>
                    </div>
                ))}
            </div>

            {/* Taskbar Layer */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gray-800 border-t border-gray-600 flex items-center px-2 gap-2 z-[100]">
                {sessions.map(session => (
                    <button
                        key={session.id}
                        onClick={() => {
                            if (session.isActive && !session.isMinimized) {
                                onUpdateSession(session.id, { isMinimized: true, isActive: false });
                            } else {
                                onUpdateSession(session.id, { isMinimized: false, isActive: true });
                                onFocusSession(session.id);
                            }
                        }}
                        className={`
                            px-3 py-1 rounded text-xs font-mono flex items-center gap-2 max-w-[150px]
                            ${session.isActive && !session.isMinimized
                                ? 'bg-gray-700 text-white border border-gray-500 shadow-inner'
                                : 'bg-gray-900 text-gray-400 border border-transparent hover:bg-gray-700'
                            }
                        `}
                    >
                        <span className="truncate">{session.nodeLabel}</span>
                    </button>
                ))}
                {sessions.length === 0 && <span className="text-gray-500 text-xs px-2">No active sessions</span>}
            </div>
        </>
    );
};

export default WindowManager;
