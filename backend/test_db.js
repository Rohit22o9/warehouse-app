const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../env') });
const test = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Inventory = require('./models/Inventory');
        const count = await Inventory.countDocuments();
        fs.writeFileSync('db_check.txt', `Inventory Count: ${count}`);
        process.exit();
    } catch (err) {
        fs.writeFileSync('db_check.txt', `Error: ${err.message}`);
        process.exit(1);
    }
};

test();
