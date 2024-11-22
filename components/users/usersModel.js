var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

var findUserByUsername = async (username) => {
  if (!username) {
    throw new Error('Username is required');
  }
  
  return prisma.user.findUnique({ where: { username } });
};

var createUser = async (username, hashedPassword) => {
  return prisma.user.create({
    data: { username, password: hashedPassword },
  });
};

module.exports = { findUserByUsername, createUser };
