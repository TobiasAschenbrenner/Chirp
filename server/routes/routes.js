const router = require("express").Router();

const {
  registerUser,
  loginUser,
  getUser,
  getUsers,
  editUser,
  followUnfollowUser,
  changeUserAvatar,
  searchUsers,
} = require("../controllers/userControllers");
const {
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
} = require("../controllers/postControllers");
const {
  createComment,
  getComment,
  deleteComment,
} = require("../controllers/commentControllers");
const {
  createMessage,
  getMessage,
  getConversations,
} = require("../controllers/messageControllers");

const authMiddleware = require("../middleware/authMiddleware");

const {
  validateRegistrationBody,
  validateLoginBody,
  validateProfileBody,
  validatePostBody,
  validateCommentBody,
  validateObjectIdParam,
} = require("../middleware/requestValidation");

const validateId = validateObjectIdParam("id");
const validatePostId = validateObjectIdParam("postId");
const validateCommentId = validateObjectIdParam("commentId");
const validateReceiverId = validateObjectIdParam("receiverId");

// USER ROUTES
router.post("/users/register", validateRegistrationBody, registerUser);
router.post("/users/login", validateLoginBody, loginUser);
router.get("/users/search", authMiddleware, searchUsers);
router.get("/users/bookmarks", authMiddleware, getUserBookmarks);
router.patch("/users/edit", authMiddleware, validateProfileBody, editUser);
router.get("/users/:id", authMiddleware, validateId, getUser);
router.get("/users", authMiddleware, getUsers);

// POST ROUTES
router.post("/posts", authMiddleware, validatePostBody, createPost);
router.get("/posts/following", authMiddleware, getFollowingPosts);
router.get("/posts/:id", authMiddleware, validateId, getPost);
router.get("/posts", authMiddleware, getPosts);
router.patch(
  "/posts/:id",
  authMiddleware,
  validateId,
  validatePostBody,
  updatePost,
);
router.delete("/posts/:id", authMiddleware, validateId, deletePost);
router.get("/posts/:id/like", authMiddleware, validateId, likeDislikePost);
router.get("/posts/:id/bookmarks", authMiddleware, validateId, createBookmark);

// COMMENT ROUTES
router.post(
  "/comments/:postId",
  authMiddleware,
  validatePostId,
  validateCommentBody,
  createComment,
);
router.get("/comments/:postId", authMiddleware, validatePostId, getComment);
router.delete(
  "/comments/:commentId",
  authMiddleware,
  validateCommentId,
  deleteComment,
);

// MESSAGE ROUTES
router.post(
  "/messages/:receiverId",
  authMiddleware,
  validateReceiverId,
  createMessage,
);
router.get(
  "/messages/:receiverId",
  authMiddleware,
  validateReceiverId,
  getMessage,
);
router.get("/conversations", authMiddleware, getConversations);

module.exports = router;
