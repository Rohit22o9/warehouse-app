const mongoose = require('mongoose');

const sensorLogSchema = new mongoose.Schema({
    warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    zone_name: String,
    temperature: Number,
    humidity: Number,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SensorLog', sensorLogSchema);
