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
                if (range.length === 1) {
                    if (p.startsWith('>')) {
                        return { price: { gt: parseFloat(p.slice(1)) } };
                    } else if (p.startsWith('<')) { // Xử lý trường hợp "<20"
                        return { price: { lt: parseFloat(p.slice(1)) } };
                    }
                } else {
                    return { price: { gte: parseFloat(range[0]), lte: parseFloat(range[1]) } };
                }
            });
            whereConditions.OR = priceConditions;
        }        
      
        if (filters.gender && filters.gender.length > 0) {
            whereConditions.gender = { in: filters.gender };
        }
  
        if (filters.kind && filters.kind.length > 0) {
          const childMapping = {
              tops: ["Shirt", "T-shirt", "Coat", "Sweater", "Cardigan"],
              bottoms: ["Trousers", "Dress", "Skirt", "Jeans", "Pants", "Shorts"],
              shoes: ["Sandals", "Sneakers", "High heels", "Slip-ons", "Slippers", "Flip-flops", "Boots", "Ballet flats", "Crocs"],
              accessories: ["Hat", "Belt", "Socks", "Scarf", "Glove", "Sunglasses", "Wallet", "Purse"]
          };
      
          // Lấy tất cả các giá trị con được chọn
          const selectedChildren = filters.kind.filter(kind =>
              Object.values(childMapping).flat().includes(kind)
          );
      
          // Loại bỏ cha nếu con tương ứng đã được chọn
          const filteredKinds = filters.kind.filter(kind => {
              if (childMapping[kind]) {
                  // Loại bỏ cha nếu có ít nhất một giá trị con được chọn
                  return !selectedChildren.some(child => childMapping[kind].includes(child));
              }
              return true; 
          });
      
          const kindConditions = filteredKinds.flatMap(kind => {
              if (childMapping[kind]) {
                  return childMapping[kind].map(child => ({ kind: child }));
              } else {
                  return { kind: kind };
              }
          });
      
          whereConditions.OR = kindConditions;
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
