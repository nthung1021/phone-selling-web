var {PrismaClient} = require("@prisma/client");
var prisma = new PrismaClient();

const getFeaturedProducts = async () => {
    try {
        const featuredProducts = await prisma.product.findMany({
            where: { isFeatured: true }
        });
        return featuredProducts;
    } catch (error) {
        console.error('Error finding featured products:', error);
        throw error;
    }
};

module.exports = {getFeaturedProducts};
