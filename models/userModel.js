const mongoose =  require('mongoose')


const userSchema = mongoose.Schema({
    name: {
        required: true,
        min: 5,
        type: String
    },
    email:{
        type: String
    },
    account: {
        type: String,
        max:10,
        min:10,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        required: false
    }
})


module.exports = new mongoose.model('User', userSchema)