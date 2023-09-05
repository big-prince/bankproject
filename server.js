const express = require('express');
const app = express();
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors')
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
app.use(cookieParser())
app.use(cors());
dotenv.config({path: 'config.env'})

//using views
app.set('view engine', 'ejs');
//router
const userRoute = require('./routes/userRoute')
app.use('/', userRoute);

//connect database

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}


const PORT = process.env.port || 5000
//Connect to the database before listening
connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  })
}).catch(()=>{
  console.log('No internet')
})