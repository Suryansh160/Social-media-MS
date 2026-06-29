const express = require('express')
const {
  registerUser,
  loginUser,
  refreshTokenController,
  logOutController
} = require('../controllers/identity-controller')

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/refresh-token', refreshTokenController)
router.post('/logOut', logOutController)

module.exports = router
