const Post = require('../models/Post')
const logger = require('../utils/logger')
const { validateCreatePost } = require('../utils/validation')

async function invalidatePostCache (req, input) {
  const keys = await req.redisClient.keys('posts:*')

  if (keys.length > 0) {
    await req.redisClient.del(keys)
  }
}

const createPost = async (req, res) => {
  logger.info('Create post endpoint hit')

  try {
    const { error } = validateCreatePost(req.body)

    if (error) {
      logger.warn('Validation error', error.details[0].message)
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }

    const { content, mediaIds } = req.body

    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || []
    })

    await newlyCreatedPost.save()
    await invalidatePostCache(req, newlyCreatedPost._id.toString())

    logger.info('Post created successfully', newlyCreatedPost)
    res.status(201).json({
      success: true,
      message: 'Post created successfully'
    })
  } catch (e) {
    logger.error('Error creating post', e)
    res.status(500).json({ success: false, message: 'Error creating post' })
  }
}

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const startIndex = (page - 1) * limit

    const cacheKey = `posts:${page}:${limit}`
    const cachedPosts = await req.redisClient.get(cacheKey)

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts))
    }

    const postsQuery = Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)

    const posts = await postsQuery
    const total = await Post.countDocuments()

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    }

    // save posts in redis cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result))

    res.json(result)
  } catch (e) {
    logger.error('Error fetching posts', e)
    res.status(500).json({ success: false, message: 'Error fetching post' })
  }
}

const getSinglePost = async (req, res) => {
  try {
    const postId = req.params.id
    const cacheKey = `post:${postId}`
    const cachedPost = await req.redisClient.get(cacheKey)

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost))
    }

    const singlePostDetailsById = await Post.findById(postId)

    if (!singlePostDetailsById) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      })
    }

    await req.redisClient.setex(
      cacheKey,
      3600,
      JSON.stringify(singlePostDetailsById)
    )

    res.json(singlePostDetailsById)
  } catch (e) {
    logger.error('Error fetching post', e)
    res
      .status(500)
      .json({ success: false, message: 'Error fetching post by id' })
  }
}

const deletePost = async (req, res) => {
  try {
  } catch (e) {
    logger.error('Error deleting post', e)
    message: 'Eror deleting post by ID'
  }
}

module.exports = { createPost, getAllPosts, getSinglePost, deletePost }
