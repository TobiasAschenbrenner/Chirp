const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: true,
      select: false,
    },
    profilePhoto: {
      type: String,
      default:
        "https://res.cloudinary.com/dglygevqa/image/upload/v1764871016/Sample_User_Icon_bqevwd.png",
    },
    bio: { type: String, default: "" },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bookmarks: [{ type: Schema.Types.ObjectId, ref: "Post" }],
    posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_document, serializedUser) => {
        delete serializedUser.password;
        return serializedUser;
      },
    },
  },
);

userSchema.index({ fullName: 1 });

module.exports = model("User", userSchema);
