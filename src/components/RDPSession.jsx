import React from 'react';

const RDPSession = ({ nodeLabel, device, onClose }) => {

    const generateRDPFile = () => {
        // Basic RDP configuration
        const rdpContent = [
            `full address:s:${device.address}`,
            `username:s:${device.username || 'Administrator'}`,
            `prompt for credentials:i:1`, // Explicitly prompt since we can't embed cleartext pass
            `screen mode id:i:2`, // Full screen
            `desktopwidth:i:0`,
            `desktopheight:i:0`,
            `session bpp:i:32`,
            `compression:i:1`,
            `keyboardhook:i:2`,
            `audiomode:i:0`,
            `redirectprinters:i:0`,
            `redirectcomports:i:0`,
            `redirectsmartcards:i:0`,
            `redirectclipboard:i:1`,
            `redirectdrives:i:1`,
            `displayconnectionbar:i:1`,
            `autoreconnection enabled:i:1`,
            `authentication level:i:2`,
            `negotiate security layer:i:1`,
            `shell working directory:s:`,
            `gatewayhostname:s:`,
            `gatewayusagemethod:i:4`,
            `gatewaycredentialssource:i:4`,
            `gatewayprofileusagemethod:i:0`,
            `promptcredentialonce:i:1`
        ].join('\r\n');

        const blob = new Blob([rdpContent], { type: 'application/x-rdp' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${nodeLabel.replace(/\s+/g, '_')}.rdp`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const copyPassword = () => {
        if (device.password) {
            navigator.clipboard.writeText(device.password);
            // Optional: Show toast
        } else {
            alert("No password stored for this device.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 text-white p-8 space-y-8">
            <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/50">
                    <span className="text-4xl">🖥️</span>
                </div>
                <h2 className="text-2xl font-bold">{nodeLabel}</h2>
                <p className="text-gray-400">{device.address}</p>
                <div className="bg-gray-800 px-4 py-2 rounded border border-gray-700 mt-2 inline-block">
                    <span className="text-gray-500 text-sm">Protocol: </span>
                    <span className="font-mono text-green-400">RDP</span>
                </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full space-y-4">
                <div className="space-y-4">
                    <button
                        onClick={generateRDPFile}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                    >
                        <span>⬇️</span> Download Connection File (.rdp)
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={copyPassword}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-all flex items-center justify-center gap-2 border border-gray-600"
                        >
                            <span>🔑</span> Copy Password
                        </button>
                        <button
                            onClick={() => navigator.clipboard.writeText(device.username || 'Administrator')}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-all flex items-center justify-center gap-2 border border-gray-600"
                        >
                            <span>👤</span> Copy User
                        </button>
                    </div>
                </div>

                <div className="text-xs text-gray-500 border-t border-gray-700 pt-4">
                    <p className="mb-2"><strong>Instructions:</strong></p>
                    <ol className="list-decimal list-inside space-y-1">
                        <li>Click <strong>Copy Password</strong>.</li>
                        <li>Click <strong>Download Connection File</strong>.</li>
                        <li>Open the downloaded file.</li>
                        <li>Paste the password when prompted.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default RDPSession;
