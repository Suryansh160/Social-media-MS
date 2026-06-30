const express = require('express')
const { authenticateRequest } = require('../middlewares/authMiddleware')
const {
  createPost,
  getAllPosts,
  getSinglePost
} = require('../controllers/post-controller')

const router = express()

router.use(authenticateRequest)

router.post('/create-post', createPost)
router.get('/all-posts', getAllPosts)
router.get('/:id', getSinglePost)

module.exports = router
