var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

var getAllProducts = async () => {
  try {
    return await prisma.product.findMany();
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

var searchProducts = async (searchQuery) => {
  return prisma.product.findMany({
    where: {
      id: {
        contains: searchQuery,
        mode: 'insensitive',
      },
    },
  });
};

var getDescriptionByProductName = async (name) => {
  try {
    return await prisma.product.findUnique({
      where: { name },
      include: { Detail: true },
    });
  } catch (error) {
    console.error("Error fetching description by product ID:", error);
    throw new Error("Database error while fetching product description");
  }
};

module.exports = { getAllProducts, searchProducts, getDescriptionByProductName };

