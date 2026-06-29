require('dotenv').config()
const express = require('express')
const cors = require('cors')
const Redis = require('ioredis')
const helmet = require('helmet')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const logger = require('../../identity-service/src/utils/logger')
const proxy = require('express-http-proxy')
const resolveProxyReqPath = require('express-http-proxy/app/steps/resolveProxyReqPath')
const errorHandler = require('./middleware/errorHandler')
const validateToken = require('./middleware/authMiddleware')

const app = express()
const PORT = process.env.PORT || 3000

const redisClient = new Redis(process.env.REDIS_URL)

app.use(helmet())
app.use(cors())
app.use(express.json())

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({ success: false, message: 'Too many attempts' })
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args)
  })
})

app.use(rateLimiter)

app.use((req, res, next) => {
  logger.info(`Recieved ${req.method} request to ${req.url}`)
  logger.info(`Request body, ${req.body}`)
  next()
})

const proxyOptions = {
  proxyReqPathResolver: req => {
    return req.originalUrl.replace(/^\/v1/, '/api')
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`)
    res.status(500).json({
      message: 'Internal server error',
      error: err.message
    })
  }
}

// setting up proxy for our indentity service
app.use(
  '/v1/auth',
  proxy(process.env.IDENTOTY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json'
      return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response recieved from Identity service: ${proxyRes.statusCode}`
      )

      return proxyResData
    }
  })
)

// setting up proxy for our post service
app.use(
  '/v1/posts',
  validateToken,
  proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json'

      const userId = srcReq.user?.userId
      if (userId) {
        proxyReqOpts.headers['x-user-id'] = userId
      }

      return proxyReqOpts
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response recieved from Post service: ${proxyRes.statusCode}`)

      return proxyResData
    }
  })
)

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`API gateway is running on port ${PORT}`)
  logger.info(
    `Identity service is running on port ${process.env.IDENTOTY_SERVICE_URL}`
  )
  logger.info(`Post service is running on port ${process.env.POST_SERVICE_URL}`)
  logger.info(`Redis Url ${process.env.REDIS_URL}`)
})
