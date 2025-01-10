var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

const getReviewByProduct = async (id_product, page) => {
    try {
        // Truy vấn dữ liệu từ bảng "Review" với Prisma
        return await prisma.review.findMany({
            where: { id_product: parseInt(id_product) }, // Lọc theo id_product
        });
    } catch (err) {
        throw new Error(`Internal Server Error: ${err.message}`);
    }
};

const getNumberOfReviewByProduct = async (id_Product) => {
    try {
        const reviewCount = await prisma.review.count({
            where: {
                id_product: id_Product,
            },
        });

        console.log("test")
        return reviewCount; // Trả về số lượng review
    } catch (err) {
        throw new Error(`Error fetching review count: ${err.message}`);
    }
};

const createReview = async (id_product, username, review) => {
    return prisma.review.create({
        data: { id_product: id_product, username: username, review: review },
    });
};

module.exports = { getReviewByProduct, getNumberOfReviewByProduct, createReview }