var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

var getDescriptionByProductName = async (productName) => {
    try {
        return await prisma.product.findUnique({
            where: { lowercaseName: productName }
        });
    } catch (error) {
        console.error("Error fetching description by product name:", error);
        throw new Error("Database error while fetching product description");
    }
};

var getRelevantProducts = async (brand, excludeProductId, limit = 4) => {
    return prisma.product.findMany({
        where: {
            brand: brand, // Match the category
            NOT: { id: excludeProductId }, // Exclude the current product
        },
        take: limit, // Limit the results
    });
};

// Lấy danh sách sản phẩm 
const getAllProducts = async (page = 1, pageSize = 9, sortOrder = "") => {
    // Tính toán phân trang
    const skip = Math.max((page - 1) * pageSize, 0);

    // Sắp xếp sản phẩm dựa trên sortOrder
    let orderBy = {};
    if (sortOrder) {
        if (sortOrder === "name-asc") {
            orderBy = { name: 'asc' };
        } else if (sortOrder === "name-desc") {
            orderBy = { name: 'desc' };
        } else if (sortOrder === "price-asc") {
            orderBy = { price: 'asc' };
        } else if (sortOrder === "price-desc") {
            orderBy = { price: 'desc' };
        }
    }

    // Đếm tổng số sản phẩm
    const totalCount = await prisma.product.count();

    // Tính tổng số trang
    const totalPages = Math.ceil(totalCount / pageSize);

    // Truy vấn danh sách sản phẩm
    const products = await prisma.product.findMany({
        select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            promotion: true, // Để tính giá khuyến mãi
        },
        skip: skip,
        take: pageSize,
        orderBy: orderBy,
    });

    // Tính giá sau khuyến mãi
    const updatedProducts = products.map((product) => {
        const discountedPrice = Math.round(product.price * (100 - (product.promotion || 0)) / 100);
        return {
            ...product,
            discountedPrice,
        };
    });

    return {
        products: updatedProducts,
        totalPages: totalPages,
    };
};

// Lấy danh sách sản phẩm dựa trên tìm kiếm và bộ lọc
const getProductsByFiltersAndSearch = async (searchQuery, filters, page = 1, sortOrder = "", pageSize = 9) => {
    const whereClause = {};

    // Thêm điều kiện tìm kiếm (searchQuery)
    if (searchQuery) {
        whereClause.OR = [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { brand: { contains: searchQuery, mode: 'insensitive' } },
            { chipset: { contains: searchQuery, mode: 'insensitive' } },
            { os: { contains: searchQuery, mode: 'insensitive' } },
        ];
    }

    // Thêm các điều kiện lọc từ filters
    Object.keys(filters).forEach((key) => {
        const values = Array.isArray(filters[key]) ? filters[key] : [filters[key]];
        if (key !== 'price') {
            whereClause.AND = whereClause.AND || [];
            whereClause.AND.push({
                OR: values.map(value => {
                    if (typeof value === 'string') {
                        return { [key]: { contains: value, mode: 'insensitive' } };
                    } else if (typeof value === 'number') {
                        return { [key]: value };
                    }
                })
            });
        }
    });

    // Thêm điều kiện giá (price)
    if (filters.price && Array.isArray(filters.price)) {
        const priceConditions = filters.price.map(priceRange => {
            const [minPrice, maxPrice] = priceRange;
            if (maxPrice === Infinity) {
                return { price: { gte: parseFloat(minPrice) } };
            } else {
                return {
                    price: {
                        gte: parseFloat(minPrice),
                        lte: parseFloat(maxPrice)
                    }
                };
            }
        });

        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({
            OR: priceConditions
        });
    }

    // Tính toán phân trang
    const skip = Math.max((page - 1) * pageSize, 0);

    // Sắp xếp sản phẩm dựa trên sortOrder
    let orderBy = {};
    if (sortOrder) {
        if (sortOrder === "name-asc") {
            orderBy = { name: 'asc' };
        } else if (sortOrder === "name-desc") {
            orderBy = { name: 'desc' };
        } else if (sortOrder === "price-asc") {
            orderBy = { price: 'asc' };
        } else if (sortOrder === "price-desc") {
            orderBy = { price: 'desc' };
        }
    }

    // Đếm tổng số sản phẩm
    const totalCount = await prisma.product.count({
        where: whereClause,
    });

    // Tính tổng số trang
    const totalPages = Math.ceil(totalCount / pageSize);

    // Truy vấn danh sách sản phẩm
    const products = await prisma.product.findMany({
        where: whereClause,
        select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            promotion: true, // Để tính giá khuyến mãi
        },
        skip: skip,
        take: pageSize,
        orderBy: orderBy,
    });

    // Tính giá sau khuyến mãi
    const updatedProducts = products.map((product) => {
        const discountedPrice = Math.round(product.price * (100 - (product.promotion || 0)) / 100);
        return {
            ...product,
            discountedPrice,
        };
    });

    return {
        products: updatedProducts,
        totalPages: totalPages,
    };
};

// Hàm tìm id_product dựa trên tên sản phẩm
const getProductIdByName = async (name) => {
    try {
        const product = await prisma.product.findUnique({
            where: {
                lowercaseName: name, // Lọc theo tên sản phẩm
            },
            select: {
                id: true, // Chỉ lấy cột id
            },
        });

        if (!product) {
            throw new Error('Product not found');
        }

        return product.id; // Trả về id sản phẩm
    } catch (err) {
        throw new Error(err.message);
    }
};

module.exports = { getDescriptionByProductName, getRelevantProducts, getProductsByFiltersAndSearch, getAllProducts, getProductIdByName };
