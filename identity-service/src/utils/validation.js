const Joi = require('joi')
const { emit } = require('../models/RefreshToken')

const validateRegistration = data => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(3).max(50)
  })

  return schema.validate(data)
}

module.exports = { validateRegistration }
