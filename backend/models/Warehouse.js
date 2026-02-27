const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['COLD', 'AMBIENT', 'DRY'], required: true },
    current_temp: Number,
    current_humidity: Number
});

const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    total_capacity: Number, // in Metric Tons
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    zones: [zoneSchema]
});

module.exports = mongoose.model('Warehouse', warehouseSchema);
