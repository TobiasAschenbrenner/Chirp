const HttpError = require("../models/errorModel");
const PostModel = require("../models/postModel");
const UserModel = require("../models/userModel");

const { v4: uuid } = require("uuid");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const path = require("path");

// CREATE POST
// POST: /api/posts
// PROTECTED
const createPost = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body) {
      return next(new HttpError("Fill in text field", 422));
    }
    if (!req.files.image) {
      return next(new HttpError("Please choose an image", 422));
    } else {
      const { image } = req.files;
      // image should be less then 1mb
      if (image.size > 1000000) {
        return next(new HttpError("Image size should be less then 1MB", 422));
      }
      // rename image
      let fileName = image.name;
      fileName = fileName.split(" ");
      fileName = fileName[0] + uuid() + "." + fileName[fileName.length - 1];
      await image.mv(
        path.join(__dirname, "..", "uploads", fileName),
        async (err) => {
          if (err) {
            return next(new HttpError(err));
          }
          // upload to cloudinary
          const result = await cloudinary.uploader.upload(
            path.join(__dirname, "..", "uploads", fileName),
            { resource_type: "image" }
          );
          if (!result.secure_url) {
            return next(new HttpError("Image upload failed", 422));
          }
          // save post to db
          const newPost = await PostModel.create({
            creator: req.user.id,
            body,
            image: result.secure_url,
          });
          await UserModel.findByIdAndUpdate(newPost.creator, {
            $push: { posts: newPost?._id },
          });
          res.json(newPost);
        }
      );
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET POST
// GET: /api/posts/:id
// PROTECTED
const getPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await PostModel.findById(id)
      .populate("creator")
      .populate({ path: "comments", options: { sort: { createdAt: -1 } } });
    res.json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET POSTS
// GET: /api/posts
// PROTECTED
const getPosts = async (req, res, next) => {
  try {
    const posts = await PostModel.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// UPDATE POST
// PATCH: /api/posts/:id
// PROTECTED
const updatePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { body } = req.body;
    // get post from db
    const post = await PostModel.findById(postId);
    // check if creator is the same as logged in user
    if (post?.creator != req.user.id) {
      return next(new HttpError("You are not allowed to edit this post", 403));
    }
    const updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      { body },
      { new: true }
    );
    res.json(updatedPost).status(200);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// DELETE POST
// DELETE: /api/posts/:id
// PROTECTED
const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    // get post from db
    const post = await PostModel.findById(postId);
    // check if creator is the same as logged in user
    if (post?.creator != req.user.id) {
      return next(
        new HttpError("You are not allowed to delete this post", 403)
      );
    }
    const deletedPost = await PostModel.findByIdAndDelete(postId);
    await UserModel.findByIdAndUpdate(deletedPost.creator, {
      $pull: { posts: deletedPost?._id },
    });
    res.json(deletedPost).status(200);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET FOLLOWING POSTS
// GET: /api/posts/following
// PROTECTED
const getFollowingPosts = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    const posts = await PostModel.find({ creator: { $in: user?.following } });
    res.json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// LIKE/DISLIKE POST
// GET: /api/posts/:id/like
// PROTECTED
const likeDislikePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await PostModel.findById(id);
    // check if user already liked the post
    let updatedPost;
    if (post?.likes.includes(req.user.id)) {
      updatedPost = await PostModel.findByIdAndUpdate(
        id,
        { $pull: { likes: req.user.id } },
        { new: true }
      );
    } else {
      updatedPost = await PostModel.findByIdAndUpdate(
        id,
        { $push: { likes: req.user.id } },
        { new: true }
      );
    }
    res.json(updatedPost);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET USER POSTS
// GET: /api/users/:id/posts
// PROTECTED
const getUserPosts = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const posts = await UserModel.findById(userId).populate({
      path: "posts",
      options: { sort: { createdAt: -1 } },
    });
    res.json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// CREATE BOOKMARK
// POST: /api/posts/:id/bookmarks
// PROTECTED
const createBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;
    // get user from db and check if post is already bookmarked. If yes, remove it. If no, add it.
    const user = await UserModel.findById(req.user.id);
    const postIsBookmarked = user?.bookmarks?.includes(id);
    if (postIsBookmarked) {
      const userBookmarks = await UserModel.findByIdAndUpdate(
        req.user.id,
        { $pull: { bookmarks: id } },
        { new: true }
      );
      res.json(userBookmarks);
    } else {
      const userBookmarks = await UserModel.findByIdAndUpdate(
        req.user.id,
        { $push: { bookmarks: id } },
        { new: true }
      );
      res.json(userBookmarks);
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET BOOKMARKS
// GET: /api/bookmarks
// PROTECTED
const getUserBookmarks = async (req, res, next) => {
  try {
    const userBookmarks = await UserModel.findById(req.user.id).populate({
      path: "bookmarks",
      options: { sort: { createdAt: -1 } },
    });
    res.json(userBookmarks);
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createPost,
  getPost,
  getPosts,
  updatePost,
  deletePost,
  getFollowingPosts,
  likeDislikePost,
  getUserPosts,
  createBookmark,
  getUserBookmarks,
};
