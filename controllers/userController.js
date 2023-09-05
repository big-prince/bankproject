const express = require('express')
const app =  express()
const User = require('../models/userModel')
const Transaction = require('../models/transaction')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transaction = require('../models/transaction');
const Pins = require('../models/pin')

exports.home = (req, res)=>{
  res.render('../views/index.ejs')
}
exports.signup = async (req, res, next) => {
    const { name, email, account, password } = req.body;
  
    // Check if all required fields are provided
    if (!name || !email || !account || !password) {
      return res.status(400).send('All fields are required.');
    }
    //check if email exists
    const emailExists = await User.findOne({email})
    if(emailExists){
      console.log('Email already exists')
      return res.status(404).send('Email Already Exists')
    }
    //check if account exsits
    const accountExists = await User.findOne({account})
    if(accountExists){
      console.log('Account Number already exists')
      return res.status(404).send('Account number already exists')
    }
    //bcrypt password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    //create user according to model
    const user = new User({name, email, account, password: hashedPassword, balance: 0})
    //save user to database
    try {
      const savedUser = await user.save()
    } catch (error) {
      console.log('Unable to save user', error)
    }
    //generate token 
    const token = await jwt.sign({email}, process.env.TOKEN_SECRET, {expiresIn: '2h'})
    //saving in req.session
    req.session.user = {
      name: user.name,
      account: user.account,
      balance: user.balance
    }
  
    
    console.log('Signup Successful')
    res.header('Authorization', `Bearer`).send('Success')
  
  };
  

  exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send('Email and password are required fields.');
    }
    //check if email exists
    const emailExists = await User.findOne({email})
    if(!emailExists){
      console.log('Incorrect email')
      return res.status(404).json({message: 'Incorrect email'})
    }
    //check if password correct
    const passwordExists = await bcrypt.compare(req.body.password, emailExists.password)
    if(!passwordExists){
      console.log('Incorrect password')
      return res.status(404).json({message: 'Incorrect password'})
    }
    //create token 
    const token = await jwt.sign({email}, process.env.TOKEN_SECRET, {expiresIn: process.env.JWT_REFRESH_EXPIRATION});
    //save to session
    req.session.user = {
      name: emailExists.name,
      account: emailExists.account,
      balance: emailExists.balance
    }
    res.header('Authorization').json({message: "Login Successful"})
  };

  exports.dashboard = async (req, res) => {
    try {
      // Get user account from session
      const userAccount = req.session.user.account;
  
      // Check if account exists
      const accountExists = await User.findOne({ account: userAccount });
      if (accountExists) {
  
        // Fetch transaction history for the account
        const tHistory = await Transaction.find({ user: accountExists.name }).sort({ timestamp: -1 });
  
        // Map transaction data for rendering
        const transactionsForRendering = tHistory.map(transaction => ({
          tTime: transaction.timestamp.toISOString().split('T')[0],
          tDescription: transaction.description,
          tAmount: transaction.amount
        }));
  
        // Render the EJS template
        res.render('../views/home.ejs', {
          transactions: transactionsForRendering, // Pass the array of transactions
          profilename: accountExists.name,
          accountNumber: accountExists.account,
          accountBalance: accountExists.balance
        });
      }
    } catch (error) {
      console.log('Error in displaying homepage:', error);
      res.render('../views/index.ejs');
    }
  };
  
  
  exports.moneyLogic = async (req, res) => {
    req.session.user.balance
    const { recipient, amount, oldPin } = req.body;
    const incoming = parseInt(amount);
  
    if (!recipient || !amount) {
      return res.status(400).send('Recipient and amount are required fields.');
    }

    //current user
    const currentUser = await User.findOne({account: req.session.user.account})
  
    //check if recipient exists
      const recipientAccount = await User.findOne({ account: recipient });
      if (!recipientAccount) {
        console.log('Recipient does not exist');
        return res.status(404).json({message:'Recipient does not exist' });
      }

    //check if user is on debt
    if(currentUser.balance <= 0){
      console.log('user on debt')
      return res.status(400).json({message: 'insufficient funds1'})
    }

    //check if user wants to send more than they have
    if(incoming > currentUser.balance){
      console.log('Insufficient funds')
      return res.status(400).json({message: "insufficient funds2"})
    }

    //check if recipient is the user
    if(recipientAccount.account === req.session.user.account){
      console.log('Cant send to users account')
      return res.status(400).json({message: "Cant send to self account"})
    }
    //check if the pin is correct
    const pinExists = await Pins.findOne({user: req.session.user.name})
    if(pinExists){
      // await bcrypt to compare
      const correctPin = await bcrypt.compare(req.body.oldPin, pinExists.pin)
      if(!correctPin){
        console.log('Pin is incorrect')
        return res.status(404).json({message: 'Incorrect pin'})
      }
    }else{
      console.log('User does not have a pin')
      return res.status(404).json({message: 'No pin found'})
    }

    //   //change the recipient balance
      const newBalance = recipientAccount.balance + incoming;
      recipientAccount.balance = newBalance;
      //save new balance to DB
      try {
        await recipientAccount.save()
      
      } catch (error) {
        console.log('Unable to save balance', error)
      }
    //credit own account
    const accountName = req.session.user.account
    //check if account exists
    const accountExists = await User.findOne({account: req.session.user.account})
    if(accountExists){
      const aBalance = accountExists.balance - incoming
      accountExists.balance = aBalance
      //try to save balance
      try {
        await accountExists.save()
        console.log('User debited')
      } catch (error) {
        console.log('Unable to debit user', error)
      }
      //save transaction of the user
      try{
        const TN = recipientAccount.name
        const TA = recipientAccount.account

        const UN = accountExists.name
        const UA = accountExists.account
      
        const currentT = new Transaction({
          user: accountExists.name,
           description: `Sent money to ${TN}(${TA})`,
          amount: incoming
         })
        
        const recipientT = new Transaction({
          user: recipientAccount.name,
          description:  `Received money from ${UN}(${UA})`,
          amount: incoming
        })

         //save transaction history
         await currentT.save()
         await recipientT.save()
         console.log('History saved')
      }catch(error){
        console.log('Error in saving transaction', error)
      }
      return res.json({userBalance: accountExists.balance})
    }

    //send response back to frontend
    res.status(200).json({
      message:'Money Sent', name: accountExists.name, account: accountExists.account
    })
      

  };
  
  exports.requestLogic = async (req, res) => {
    req.session.user.balance
    const { recipient, amount } = req.body;
    const incoming = parseInt(amount);
  
    if (!recipient || !amount) {
      return res.status(400).send('Recipient and amount are required fields.');
    }
    //check if recipient exists
      const recipientAccount = await User.findOne({ account: recipient });
      if (!recipientAccount) {
        console.log('Recipient does not exist...');
        return res.status(404).send('Recipient does not exist.');
      }
      console.log(recipientAccount.balance, "Recipient account balance")
    //   //change the recipient balance
      const newBalance = recipientAccount.balance - incoming;
      recipientAccount.balance = newBalance;
      //save new balance to DB
      try {
        await recipientAccount.save()
        console.log(recipientAccount.balance, 'Still recipient')
      } catch (error) {
        console.log('Unable to save balance', error)
      }
    //credit own account
    const accountName = req.session.user.account
    //check if account exists
    const accountExists = await User.findOne({account: req.session.user.account})
    if(accountExists){
      const aBalance = accountExists.balance + incoming
      console.log(aBalance, "User balance")
      accountExists.balance = aBalance
      //try to save balance
      try {
        await accountExists.save()
        console.log(accountExists.balance, 'User debited')
      } catch (error) {
        console.log('Unable to debit user', error)
      }
    }

    //send response back to frontend
    res.status(200).send('Money Sent')
      
  };

exports.createPin = async (req, res)=>{
  try {
    
    const {pin, password} = req.body
    if(!{pin, password}){
      console.log('Not received')
      return res.status(404).send('Data not received')
    }
    //check if user already has a pin
    const user = await Pins.findOne({user: req.session.user.name})
    if(user){
      console.log('Pin exists')
      return res.status(400).json({message: "User has Pin"})
    }
    //hash the pin
    const salt = await bcrypt.genSalt(10)
    const hashedPin = await bcrypt.hash(req.body.pin, salt)
    //compare the loggedin USer with the user in transaction database
    const LoggedUser = req.session.user.name
    //check if that user in database
    const awaitUser = await User.findOne({name: LoggedUser})
    if(!awaitUser){
      console.log('User not in database')
    }
    //check if the password is correct
    const confirmPassword = await bcrypt.compare(req.body.password, awaitUser.password)
    if(!confirmPassword){
      console.log('Password is correct..')
      return res.status(404).send('password is incorrect..')
    }
  
    //create that user with the pin
    const newPin = new Pins({user: awaitUser.name, pin:hashedPin})

    //save pin to db
    try {
      await newPin.save()
      console.log("pin saved")
    } catch (error) {
      console.log('Unable to save pin', error)
    }

    //send to user 
    res.status(200).json({message: 'Pin Created..'})
  } catch (error) {
    console.log('Error in creating pin...', error)
    return res.status(404).json({message: "User already has password"}) 
  }

}