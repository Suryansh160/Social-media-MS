require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const cors = require('cors')
const helmet = require('helmet')
const postRoutes = require('./routes/post-routes')
const errorHandler = require('./middlewares/errorHandler')
const logger = require('./utils/logger')
const { rateLimit } = require('express-rate-limit')

const app = express()
const PORT = process.env.PORT || 3002

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to mongoDB'))
  .catch(e => logger.error('Mongo connection error', e))

const redisClient = new Redis(process.env.REDIS_URL)

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`)
  logger.info(`Request body, ${req.body}`)
  next()
})

// Implement IP based rate limiting for sensitive endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests'
})

app.use(limiter)

app.use(
  '/api/posts',
  (req, res, next) => {
    req.redisClient = redisClient

    next()
  },
  postRoutes
)

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`Identity service running on port ${PORT}`)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', promise, 'reason:', reason)
})
