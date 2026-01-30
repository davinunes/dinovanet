import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, options, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    if (!options || options.length === 0) return null;

    return (
        <div
            ref={menuRef}
            className="absolute z-50 bg-gray-800 border border-gray-700 rounded shadow-lg py-1 min-w-[150px]"
            style={{ top: y, left: x }}
        >
            <ul className="text-gray-200 text-sm">
                {options.map((option, index) => (
                    <li
                        key={index}
                        className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                            option.action();
                            onClose();
                        }}
                    >
                        {option.icon && <span>{option.icon}</span>}
                        {option.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ContextMenu;
