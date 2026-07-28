const { test } = require("node:test");
const assert = require("node:assert/strict");

const PostModel = require("../models/postModel");
const { getPosts } = require("../controllers/postControllers");

test("includes creator summaries when retrieving the feed", async (t) => {
  const posts = [
    {
      _id: "507f191e810c19729de860eb",
      body: "Test post",
      creator: {
        _id: "507f191e810c19729de860ea",
        fullName: "Feed Author",
        profilePhoto: "https://example.com/avatar.png",
      },
    },
  ];

  const populateMock = t.mock.fn(async () => posts);

  const query = {
    populate: populateMock,
    then: (resolve, reject) => Promise.resolve(posts).then(resolve, reject),
  };

  const sortMock = t.mock.fn(() => query);
  const findMock = t.mock.method(PostModel, "find", () => ({
    sort: sortMock,
  }));

  const jsonMock = t.mock.fn();
  const nextMock = t.mock.fn();

  await getPosts({}, { json: jsonMock }, nextMock);

  assert.equal(findMock.mock.callCount(), 1);
  assert.equal(populateMock.mock.callCount(), 1);
  assert.deepEqual(populateMock.mock.calls[0].arguments, [
    "creator",
    "fullName profilePhoto",
  ]);
  assert.deepEqual(jsonMock.mock.calls[0].arguments[0], posts);
  assert.equal(nextMock.mock.callCount(), 0);
});
