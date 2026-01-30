import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = './data';
const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');
const CONNECTIONS_FILE = path.join(DATA_DIR, 'connections.json');
const TOPOLOGIES_FILE = path.join(DATA_DIR, 'topologies.json');

async function migrate() {
    console.log("Starting migration...");

    try {
        // 1. Read existing data
        const devicesRaw = await fs.readFile(DEVICES_FILE, 'utf-8');
        const connectionsRaw = await fs.readFile(CONNECTIONS_FILE, 'utf-8');

        const devices = JSON.parse(devicesRaw);
        const connections = JSON.parse(connectionsRaw);

        console.log(`Found ${devices.length} devices and ${connections.length} connections.`);

        // 2. Create Default Topology
        const defaultTopologyId = uuidv4();
        const defaultTopology = {
            id: defaultTopologyId,
            name: "Default Topology",
            description: "Migrated from v1",
            nodes: [],
            edges: connections // Move all current edges to this topology
        };

        // 3. Move positions to Topology Nodes
        const cleanDevices = devices.map(d => {
            // Create a node for this device in the topology
            if (d.position) {
                defaultTopology.nodes.push({
                    id: d.id, // Keep ID same for easy linking
                    deviceId: d.id, // Link back to device inventory
                    type: d.type || 'device',
                    position: d.position,
                    data: { ...d } // Optional: Keep data snapshotted or linked? 
                    // React Flow typically stores data in the node. 
                    // For now, let's replicate the structure TopologyMap expects.
                });
            }

            // Return device WITHOUT position (Inventory representation)
            const { position, ...deviceWithoutPos } = d;
            return deviceWithoutPos;
        });

        // 4. Save new files
        await fs.writeFile(TOPOLOGIES_FILE, JSON.stringify([defaultTopology], null, 2));
        console.log("Created topologies.json with Default Topology.");

        await fs.writeFile(DEVICES_FILE, JSON.stringify(cleanDevices, null, 2));
        console.log("Updated devices.json (removed positions).");

        // Optional: Clear connections.json if we are fully moving to topologies
        // await fs.writeFile(CONNECTIONS_FILE, '[]'); 
        // console.log("Cleared connections.json.");

        console.log("Migration complete!");

    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
