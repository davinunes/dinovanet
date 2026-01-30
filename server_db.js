import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = './data';
const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');
const CONNECTIONS_FILE = path.join(DATA_DIR, 'connections.json');

// Ensure data directory exists
async function ensureDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR);
    }
}

async function readJson(file, defaultValue = []) {
    try {
        await ensureDir();
        const data = await fs.readFile(file, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(file, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        throw error;
    }
}

async function writeJson(file, data) {
    await ensureDir();
    await fs.writeFile(file, JSON.stringify(data, null, 2));
}

export const db = {
    getDevices: () => readJson(DEVICES_FILE),
    saveDevices: (devices) => writeJson(DEVICES_FILE, devices),
    getConnections: () => readJson(CONNECTIONS_FILE),
    saveConnections: (connections) => writeJson(CONNECTIONS_FILE, connections),
};
