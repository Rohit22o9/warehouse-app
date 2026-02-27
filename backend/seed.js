const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

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

        // 1. Clear existing data (Careful!)
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

        // 4. Create a Smart Warehouse
        const warehouse = await Warehouse.create({
            name: 'Nari Shakti Smart Storage Pune',
            location: 'Hadapsar, Pune',
            total_capacity: 5000,
            manager_id: manager._id,
            zones: [
                { name: 'Zone A', type: 'COLD', current_temp: 4.5, current_humidity: 85 },
                { name: 'Zone B', type: 'AMBIENT', current_temp: 22.0, current_humidity: 60 }
            ]
        });

        // 5. Create Sample Inventory
        await Inventory.create([
            {
                warehouse_id: warehouse._id,
                zone_name: 'Zone A',
                produce_type: 'Tomato',
                farmer_id: farmer._id,
                quantity: 500,
                unit: 'kg',
                harvest_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                qr_code_uid: 'QR-TOM-001',
                status: 'STORED'
            },
            {
                warehouse_id: warehouse._id,
                zone_name: 'Zone B',
                produce_type: 'Onion',
                farmer_id: farmer._id,
                quantity: 1200,
                unit: 'kg',
                harvest_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                qr_code_uid: 'QR-ONI-002',
                status: 'STORED'
            }
        ]);

        // 6. Create Sample Sensor Logs
        const logs = [];
        for (let i = 0; i < 10; i++) {
            logs.push({
                warehouse_id: warehouse._id,
                zone_name: 'Zone A',
                temperature: 4.5 + (Math.random() * 2),
                humidity: 82 + (Math.random() * 5),
                timestamp: new Date(Date.now() - i * 60 * 60 * 1000) // 1 log per hour
            });
        }
        await SensorLog.insertMany(logs);

        console.log('Successfully seeded database with sample data!');
        process.exit();
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
