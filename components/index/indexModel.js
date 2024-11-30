var {PrismaClient} = require("@prisma/client");
var prisma = new PrismaClient();

var getFeaturedProducts = async () => {
    try {
        return prisma.product.findMany({
            where: { isFeatured: true },
            take: 8,
        });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        throw error;
    }   
};

module.exports = {getFeaturedProducts};