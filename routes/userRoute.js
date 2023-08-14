const express = require("express");
const router = express.Router()
const UserController = require('../controllers/userController');

router.get('/', UserController.home)
router.post('/signup', UserController.signup)
router.post('/login', UserController.login)
router.get('/home', UserController.dashboard)
router.post('/home', UserController.moneyLogic)
router.post('/home/request',UserController.requestLogic)
router.post('/home/createPin', UserController.createPin)






module.exports = router