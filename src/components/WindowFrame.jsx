import React, { useState, useRef, useEffect } from 'react';

const WindowFrame = ({
    id,
    title,
    onClose,
    onMinimize,
    isMaximized,
    onMaximizeToggle,
    isActive,
    onFocus,
    initialX = 50,
    initialY = 50,
    children
}) => {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const windowRef = useRef(null);

    const handleMouseDown = (e) => {
        if (isMaximized) return; // Don't drag if maximized
        if (e.button !== 0) return; // Only left click

        e.preventDefault(); // Prevent text selection
        onFocus(); // Bring to front

        setIsDragging(true);
        const rect = windowRef.current.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;

            const newX = e.clientX - dragOffset.current.x;
            const newY = e.clientY - dragOffset.current.y;

            // Simple bounds checking (optional, keep on screen)
            // const boundedY = Math.max(0, newY);

            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const containerStyle = isMaximized
        ? { top: 0, left: 0, width: '100vw', height: '100vh', transform: 'none' }
        : { top: position.y, left: position.x, width: '800px', height: '600px' };

    return (
        <div
            ref={windowRef}
            className={`absolute flex flex-col bg-gray-900 border border-gray-700 rounded shadow-2xl overflow-hidden transition-shadow duration-200 ${isActive ? 'z-50 border-blue-500 shadow-blue-500/20' : 'z-40'}`}
            style={{
                ...containerStyle,
                position: isMaximized ? 'fixed' : 'absolute',
            }}
            onMouseDown={onFocus}
        >
            {/* Title Bar */}
            <div
                className={`bg-gray-800 p-2 flex justify-between items-center px-4 border-b border-gray-700 select-none ${!isMaximized ? 'cursor-move' : ''}`}
                onMouseDown={handleMouseDown}
                onDoubleClick={onMaximizeToggle}
            >
                <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm truncate max-w-[200px]">{title}</span>
                </div>
                <div className="flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                    <button onClick={onMinimize} className="text-gray-400 hover:text-white px-2 hover:bg-gray-700 rounded">─</button>
                    <button onClick={onMaximizeToggle} className="text-gray-400 hover:text-white px-2 hover:bg-gray-700 rounded">
                        {isMaximized ? '❐' : '□'}
                    </button>
                    <button onClick={onClose} className="text-red-400 hover:text-red-300 px-2 hover:bg-gray-700 rounded">✕</button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative bg-[#1e1e1e]">
                {children}
            </div>
        </div>
    );
};

export default WindowFrame;
