const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { getUserId } = require("../utils");

async function signup(parent, { email, password, name }, context) {
  const passwordHash = await bcrypt.hash(password, 8);
  const user = await context.prisma.createUser({
    email,
    password: passwordHash,
    name
  });

  const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

  return {
    token,
    user
  };
}

async function login(parent, { email, password }, context) {
  const user = await context.prisma.user({ email });

  if (!user) {
    throw new Error("User not found or invalid password");
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    throw new Error("User not found or invalid password");
  }

  const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);

  return {
    token,
    user
  };
}

function post(parent, { description, url }, context) {
  const userId = getUserId(context);

  return context.prisma.createLink({
    url,
    description,
    postedBy: { connect: { id: userId } }
  });
}

async function updateLink(parent, { id, description, url }, context) {
  const userId = getUserId(context);

  const user = await context.prisma.link({ id }).postedBy();

  if (!user || user.id !== userId) {
    throw new Error("You can't update this link");
  }

  return context.prisma.updateLink({
    data: { description, url },
    where: { id }
  });
}

async function deleteLink(parent, { id }, context) {
  const userId = getUserId(context);

  const user = await context.prisma.link({ id }).postedBy();

  if (!user || user.id !== userId) {
    throw new Error("You can't delete this link");
  }

  return context.prisma.deleteLink({ id });
}

async function vote(parent, { linkId }, context) {
  const userId = getUserId(context);

  const exists = await context.prisma.$exists.vote({
    user: { id: userId },
    link: { id: linkId }
  });

  if (exists) {
    throw new Error(`Already voted for link: ${linkId}`);
  }

  return context.prisma.createVote({
    user: { connect: { id: userId } },
    link: { connect: { id: linkId } }
  });
}

module.exports = {
  signup,
  login,
  post,
  updateLink,
  deleteLink,
  vote
};
