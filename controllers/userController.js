const express = require('express')
const app =  express()
const User = require('../models/userModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
exports.home = async (req, res)=>{
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
    console.log(req.session.user, 'Session saved')
    
    console.log('Signup Successful')
    res.header('Authorization', `Bearer${token}`).send('Success')
  
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
      return res.status(404).send('Incorrect email')
    }
    //check if password correct
    const passwordExists = await bcrypt.compare(req.body.password, emailExists.password)
    if(!passwordExists){
      console.log('Incorrect password')
      return res.status(404).send('Incorrect password')
    }
    //create token 
    const token = await jwt.sign({email}, process.env.TOKEN_SECRET, {expiresIn: '2h'});
    //save to session
    req.session.user = {
      name: emailExists.name,
      account: emailExists.account,
      balance: emailExists.balance
    }
    console.log(req.session.user)
    res.header('Authorization', `Bearer${token}`).send('Success')
  };

exports.dashboard = async (req, res) => {
    try {
      //get req.session
      const user = req.session.user;
      console.log(user)

      //render ejs
      res.render('../views/home.ejs', {
        profilename: user.name,
        accountNumber: user.account,
        accountBalance: user.balance
      })
    } catch (error) {
      console.log('error in displaying homepage', error)
      res.status(500).send('Error in displaying homepage')
    }
  };
  
  exports.moneyLogic = async (req, res) => {
    console.log(req.session.user)
    // const { recipient, amount } = req.body;
    // const incoming = parseInt(amount);
  
    // if (!recipient || !amount) {
    //   return res.status(400).send('Recipient and amount are required fields.');
    // }
    // //check if recipient exists
    //   const recipientAccount = await User.findOne({ account: recipient });
    //   if (!recipientAccount) {
    //     console.log('Recipient does not exist...');
    //     return res.status(404).send('Recipient does not exist.');
    //   }
    //   //console.log recipient balance
    //   console.log(recipientAccount.balance)
    //   //change the recipient balance
    //   const newBalance = recipientAccount.balance + incoming;
    //   recipientAccount.balance = newBalance;
    //   //save new balance to DB
    //   try {
    //     await recipientAccount.save()
    //     console.log(recipientAccount.balance)
    //   } catch (error) {
    //     console.log('Unable to save balance', error)
    //   }
    //   //credit own account
    //   console.log(req.session.user.balance)
    // res.status(200).send('Money Sent...');
  };
  
  exports.requestLogic = async (req, res) => {
    // const loggedUserBalance = req.session.loggedUser;
    console.log(loggedUserBalance); // This should now correctly log the balance value
  
    const { recipient, amount } = req.body;
    const incoming = parseInt(amount);
  
    if (!recipient || !amount) {
      return res.status(400).send('Recipient and amount are required fields.');
    }
  
    try {
      const recipientAccount = await User.findOne({ account: recipient });
      if (!recipientAccount) {
        console.log('Recipient does not exist...');
        return res.status(404).send('Recipient does not exist.');
      }
  
      const newBalance = recipientAccount.balance - incoming;
      // req.session.newBalance = newBalance; // Store the new balance in the session
      recipientAccount.balance = newBalance;
      await recipientAccount.save();
      console.log('Balance updated...');
    } catch (error) {
      console.log('Error updating balance:', error);
      return res.status(500).send('Error updating balance.');
    }
  
    res.status(200).send('Money Sent...');
  };
  