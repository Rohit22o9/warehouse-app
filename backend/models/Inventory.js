const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    warehouse_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    zone_name: String, // Reference by name inside the nested zone array or use ObjectID if preferred
    produce_type: { type: String, required: true },
    farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quantity: Number,
    unit: { type: String, default: 'kg' },
    harvest_date: Date,
    storage_date: { type: Date, default: Date.now },
    expiry_date: Date,
    qr_code_uid: { type: String, unique: true },
    status: {
        type: String,
        enum: ['STORED', 'DISPATCHED', 'SPOILED'],
        default: 'STORED'
    }
});

module.exports = mongoose.model('Inventory', inventorySchema);
