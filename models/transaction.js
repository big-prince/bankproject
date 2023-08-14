const mongoose = require('mongoose');


//create schema
const transactionSchema = mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
    
})

module.exports = new mongoose.model("Transaction", transactionSchema);
