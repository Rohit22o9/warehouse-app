const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const SensorLog = require('./models/SensorLog');
const Inventory = require('./models/Inventory');

dotenv.config({ path: path.join(__dirname, '.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const sensorCount = await SensorLog.countDocuments();
        const inventoryCount = await Inventory.countDocuments();
        console.log(`Sensors: ${sensorCount}, Inventory: ${inventoryCount}`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
