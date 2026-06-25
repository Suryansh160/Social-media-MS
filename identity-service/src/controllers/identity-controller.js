const generateTokens = require('../utils/generateTokens')
const logger = require('../utils/logger')
const { validateRegistration } = require('../utils/validation')

// user registration
const registerUser = async (req, res) => {
  logger.info('Registration endpoint hit...')

  try {
    const { error } = validateRegistration(req.body)

    if (error) {
      logger.warn('Validation error', error.details[0].message)
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const { email, username, password, name } = req.body

    let user = await UserActivation.findOne({ $or: [{ email }, { username }] })

    if (user) {
      logger.warn('User already exists')

      return res.status(400).json({
        success: false,
        message: 'User already exists'
      })
    }

    const user = new User({ username, email, password, name })
    await user.save()
    logger.warn('User saved successfully', user._id)

    const { accessToken, refreshToken } = await generateTokens(user)

    res.status(201).json({
      success: true,
      message: 'user registered successfully',
      accessToken,
      refreshToken
    })
  } catch (e) {
    logger.error('Registeration error occured', e),
      res.status(500).json({
        success: true,
        message: 'Internal server error'
      })
  }
}

// user login

// refresh token

// logout

module.exports = { registerUser }
