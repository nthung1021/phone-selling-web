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

var getDescriptionByProductName = async (productName) => {
    try {
        return await prisma.product.findUnique({
          where: { name: productName }
        });
    }   catch (error) {
        console.error("Error fetching description by product ID:", error);
        throw new Error("Database error while fetching product description");
    }
};

var getRelevantProducts = async (category, excludeProductId, limit = 4) => {
    return prisma.product.findMany({
        where: {
            category: category, // Match the category
            NOT: { id: excludeProductId }, // Exclude the current product
        },
        take: limit, // Limit the results
    });
};

// Filter
const findFilteredProducts = async (filters) => {
    try {
        const whereConditions = {}; // Xây dựng điều kiện lọc

        if (filters.price && Array.isArray(filters.price)) {
            const priceConditions = filters.price.map(p => {
                const range = p.split('-');
                return range.length === 1
                    ? { price: { lt: parseFloat(range[0]) } }
                    : { price: { gte: parseFloat(range[0]), lte: parseFloat(range[1]) } };
            });
            whereConditions.OR = priceConditions;
        }

        if (filters.gender && filters.gender.length > 0) {
            whereConditions.gender = { in: filters.gender };
        }

        if (filters.kind && filters.kind.length > 0) {
            whereConditions.kind = { in: filters.kind };
        }

        if (filters.material && filters.material.length > 0) {
            whereConditions.material = { in: filters.material };
        }

        const products = await prisma.product.findMany({ where: whereConditions });
        return products;
    } catch (error) {
        console.error('Error in findFilteredProducts:', error.message);
        throw error;
    }
};

// Search by name and description
const findProductsBySearchQuery = async (query) => {
    try {
        return await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { shortDescription: { contains: query, mode: 'insensitive' } },
                    { longDescription: { contains: query, mode: 'insensitive' } },
                ],
            },
        });
    } catch (error) {
        console.error("Error searching products:", error);
        throw error;
    }
};

module.exports = { getAllProducts, getDescriptionByProductName, getRelevantProducts, findFilteredProducts, findProductsBySearchQuery };
