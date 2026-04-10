const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../env') });
console.log('Testing connection to:', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('SUCCESS: Connected to MongoDB');
        process.exit(0);
    })
    .catch(err => {
        console.error('ERROR:', err.message);
        process.exit(1);
    });
