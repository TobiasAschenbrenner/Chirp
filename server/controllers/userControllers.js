const HttpError = require("../models/errorModel");
const UserModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../utils/cloudinary");

// REGISTER USER
// POST: /api/users/register
// UNPROTECTED
const registerUser = async (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return next(new HttpError("Please fill all required fields", 422));
    }
    // make the email lowercased
    const lowercasedEmail = email.toLowerCase();

    // check if user already exists
    const emailExists = await UserModel.findOne({ email: lowercasedEmail });
    if (emailExists) {
      return next(new HttpError("User already exists", 422));
    }

    // check if passwords match
    if (password !== confirmPassword) {
      return next(new HttpError("Passwords do not match", 422));
    }

    // check password length
    if (password.length < 6) {
      return next(new HttpError("Password must be at least 6 characters", 422));
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const newUser = await UserModel.create({
      fullName,
      email: lowercasedEmail,
      password: hashedPassword,
    });

    res.json(newUser).status(201);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// LOGIN USER
// POST: /api/users/login
// UNPROTECTED
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new HttpError("Please fill all required fields", 422));
    }

    // make the email lowercased
    const lowercasedEmail = email.toLowerCase();

    // check if user exists
    const user = await UserModel.findOne({
      email: lowercasedEmail,
    }).select("+password");
    if (!user) {
      return next(new HttpError("Invalid credentials", 422));
    }
    // const { uPassword, ...userInfo } = user;

    // compare passwords
    const comparePasswords = await bcrypt.compare(password, user?.password);
    if (!comparePasswords) {
      return next(new HttpError("Invalid credentials", 422));
    }
    const token = await jwt.sign({ id: user?._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // res.json({ token, id: user?._id, ...userInfo }).status(200);
    res.json({ token, id: user?._id }).status(200);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET USER
// GET: /api/users/:id
// PROTECTED
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    if (!user) {
      return next(new HttpError("User not found", 404));
    }
    res.json(user).status(200);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET USERS
// GET: /api/users
// PROTECTED
const getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.find().limit(10).sort({
      createdAt: -1,
    });
    res.json(users).status(200);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// EDIT USER
// PATCH: /api/users/edit
// PROTECTED
const editUser = async (req, res, next) => {
  try {
    const { fullName, bio } = req.body;
    const editedUser = await UserModel.findByIdAndUpdate(
      req.user.id,
      { fullName, bio },
      { new: true },
    );
    res.json(editedUser).status(200);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// FOLLOW/UNFOLLOW USER
// GET: /api/users/:id
// PROTECTED
const followUnfollowUser = async (req, res, next) => {
  try {
    const userToFollowId = req.params.id;
    if (req.user.id === userToFollowId) {
      return next(new HttpError("You cannot follow/unfollow yourself", 422));
    }
    const currentUser = await UserModel.findById(req.user.id);
    const isFollowing = currentUser?.following?.includes(userToFollowId);
    // follow if not following, else unfollow if already following
    if (!isFollowing) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userToFollowId,
        { $push: { followers: req.user.id } },
        { new: true },
      );

      await UserModel.findByIdAndUpdate(
        req.user.id,
        { $push: { following: userToFollowId } },
        { new: true },
      );
      res.json(updatedUser);
    } else {
      const updatedUser = await UserModel.findByIdAndUpdate(
        userToFollowId,
        { $pull: { followers: req.user.id } },
        { new: true },
      );

      await UserModel.findByIdAndUpdate(
        req.user.id,
        { $pull: { following: userToFollowId } },
        { new: true },
      );
      res.json(updatedUser);
    }
  } catch (error) {
    return next(new HttpError(error));
  }
};

// CHANGE USER PROFILE PHOTO
// POST: /api/users/avatar
// PROTECTED
const changeUserAvatar = async (req, res, next) => {
  try {
    if (!req.files || !req.files.avatar) {
      return next(new HttpError("Please choose an image", 422));
    }

    const { avatar } = req.files;

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(avatar.mimetype)) {
      return next(
        new HttpError("Only JPG, PNG, and WEBP images are allowed", 422),
      );
    }

    if (avatar.size > 500_000) {
      return next(new HttpError("File size must be less than 500KB", 422));
    }

    const fileExt = path.extname(avatar.name);
    const newFilename = `${randomUUID()}${fileExt}`;
    const tempFilePath = path.join(__dirname, "..", "uploads", newFilename);

    avatar.mv(tempFilePath, async (err) => {
      if (err) {
        return next(new HttpError("Failed to save uploaded file", 500));
      }

      try {
        const result = await cloudinary.uploader.upload(tempFilePath, {
          resource_type: "image",
          strip_metadata: true,
        });

        if (!result?.secure_url) {
          return next(new HttpError("Image upload failed", 422));
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
          req.user.id,
          { profilePhoto: result.secure_url },
          { new: true },
        );

        res.status(200).json(updatedUser);
      } catch (uploadError) {
        return next(new HttpError("Cloudinary upload failed", 500));
      } finally {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    });
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET: /api/users/search?q=...&page=1&limit=10
// PROTECTED (recommended)
const searchUsers = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      20,
    );
    const skip = (page - 1) * limit;

    if (q.length < 2) {
      return res.json({ users: [], page, limit, total: 0 });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filter = {
      fullName: { $regex: escaped, $options: "i" },
    };

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select("_id fullName profilePhoto bio followers following")
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit),
      UserModel.countDocuments(filter),
    ]);

    res.json({ users, page, limit, total });
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  getUsers,
  editUser,
  followUnfollowUser,
  changeUserAvatar,
  searchUsers,
};
