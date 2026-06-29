const Post = require('../models/Post')
const logger = require('../utils/logger')
const { validateCreatePost } = require('../utils/validation')

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
    logger.info('Post created successfully', newlyCreatedPost)
    res.status(201).json({
      success: true,
      message: 'Post created successfully'
    })
  } catch (e) {
    logger.error('Error creating post', e)
    message: 'Error creating post'
  }
}

const getAllPosts = async (req, res) => {
  try {
  } catch (e) {
    logger.error('Error fetching posts', e)
    message: 'Error fetching posts'
  }
}

const getSinglePost = async (req, res) => {
  try {
  } catch (e) {
    logger.error('Error fetching post', e)
    message: 'Eror fetching post by ID'
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
