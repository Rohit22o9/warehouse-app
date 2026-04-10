const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../env') });

// Models
const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const Inventory = require('./models/Inventory');
const SensorLog = require('./models/SensorLog');

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');

        // 1. Clear existing data
        await User.deleteMany({});
        await Warehouse.deleteMany({});
        await Inventory.deleteMany({});
        await SensorLog.deleteMany({});
        console.log('Cleared old data.');

        // 2. Create a Warehouse Manager
        const manager = await User.create({
            name: 'Priya Sharma',
            email: 'priya@agrifresh.com',
            passwordHash: 'hashed_password_here',
            role: 'WAREHOUSE_MANAGER'
        });

        // 3. Create a Farmer
        const farmer = await User.create({
            name: 'Rajesh Kumar',
            email: 'rajesh@farmer.com',
            passwordHash: 'hashed_password_here',
            role: 'FARMER'
        });

        // 4. Define 24 Zones (A1-A6, B1-B6, C1-C6, D1-D6)
        const rows = ['A', 'B', 'C', 'D'];
        const zones = [];
        for (let r of rows) {
            for (let i = 1; i <= 6; i++) {
                zones.push({
                    name: `${r}${i}`,
                    type: (r === 'A' || r === 'B') ? 'COLD' : 'AMBIENT',
                    current_temp: (r === 'A' || r === 'B') ? (4 + Math.random() * 2) : (18 + Math.random() * 5),
                    current_humidity: 60 + Math.random() * 20
                });
            }
        }

        // 5. Create the "Nashik Central Hub" Warehouse
        const warehouse = await Warehouse.create({
            name: 'Nashik Central Hub',
            location: 'Ambad, Nashik',
            total_capacity: 10000,
            manager_id: manager._id,
            zones: zones.map(z => ({
                name: z.name,
                type: z.type,
                current_temp: z.current_temp,
                current_humidity: z.current_humidity
            }))
        });

        // 6. Create Inventory and Sensor Logs for each zone
        const inventoryItems = [];
        const logs = [];
        const produceTypes = ['Tomato', 'Onion', 'Potato', 'Grapes', 'Chilli', 'Capsicum'];

        for (const z of zones) {
            // Add inventory to some zones
            if (Math.random() > 0.3) {
                const type = produceTypes[Math.floor(Math.random() * produceTypes.length)];
                inventoryItems.push({
                    warehouse_id: warehouse._id,
                    zone_name: z.name,
                    produce_type: type,
                    farmer_id: farmer._id,
                    quantity: 200 + Math.floor(Math.random() * 800),
                    unit: 'kg',
                    harvest_date: new Date(Date.now() - (Math.floor(Math.random() * 15)) * 24 * 60 * 60 * 1000),
                    qr_code_uid: `QR-${type.substring(0, 3).toUpperCase()}-${z.name}`,
                    status: 'STORED'
                });
            }

            // Create initial sensor logs
            logs.push({
                warehouse_id: warehouse._id,
                zone_name: z.name,
                temperature: z.current_temp,
                humidity: z.current_humidity,
                timestamp: new Date()
            });
        }

        await Inventory.insertMany(inventoryItems);
        await SensorLog.insertMany(logs);

        console.log('Successfully seeded "Nashik Central Hub" with 24 zones and data!');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
