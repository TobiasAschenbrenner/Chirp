require("dotenv").config();
const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");

const User = require("../models/userModel");
const Post = require("../models/postModel");
const Comment = require("../models/commentModel");

async function seed() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("Connected to MongoDB");

  await Promise.all([
    User.deleteMany(),
    Post.deleteMany(),
    Comment.deleteMany(),
  ]);

  console.log("Database cleared");

  // USERS
  const users = [];
  for (let i = 0; i < 50; i++) {
    const user = await User.create({
      fullName: faker.person.fullName(),
      email: faker.internet.email(),
      password: "hashedpassword",
      bio: faker.lorem.sentence(),
      profilePhoto: faker.image.avatar(),
    });
    users.push(user);
  }

  // FOLLOWERS
  for (const user of users) {
    const others = faker.helpers.shuffle(users).slice(0, 10);
    user.following = others.map((u) => u._id);
    await user.save();
  }

  // POSTS
  const posts = [];
  for (const user of users) {
    for (let i = 0; i < 10; i++) {
      const post = await Post.create({
        creator: user._id,
        body: faker.lorem.paragraph(),
        likes: faker.helpers
          .shuffle(users)
          .slice(0, 5)
          .map((u) => u._id),
      });
      posts.push(post);
      user.posts.push(post._id);
    }
    await user.save();
  }

  // COMMENTS
  for (const post of posts) {
    for (let i = 0; i < 5; i++) {
      const user = faker.helpers.arrayElement(users);
      const comment = await Comment.create({
        postId: post._id,
        comment: faker.lorem.sentence(),
        creator: {
          creatorId: user._id,
          creatorName: user.fullName,
          creatorPhoto: user.profilePhoto,
        },
      });
      post.comments.push(comment._id);
    }
    await post.save();
  }

  console.log("Seeding complete");
  process.exit();
}

seed();
