const express = require('express');
const app = express();
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser');
const session = require('express-session');
//session
// Enable session management
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // Set this to true if using HTTPS
      maxAge: 99000000 // Set the cookie expiration time (in milliseconds)
    }
  }));

//middleware settings
app.use(express.json())
dotenv.config({path: 'config.env'})
app.use(cookieParser())

//using views
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
//router
const userRoute = require('./routes/userRoute')
app.use('/', userRoute);

//connect database

    mongoose.connect(process.env.DATABASE)
    .then(console.log("Database connected..."))
    .catch(error=> {message: error})









const PORT = process.env.port || 5000
app.listen(PORT, async ()=>{
    console.log(`Server is started at ${PORT}`)
})