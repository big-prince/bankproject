const mongoose = require('mongoose');

//create schema
const pinSchema = mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    pin: {
        type: String,
        required: true
    }
});

module.exports = new mongoose.model('Pins', pinSchema)