var { getDescriptionByProductName, getRelevantProducts, findProducts, getProductsByFilters } = require('./productModel');

var getProduct = async (req, res) => {
    try {
        const searchQuery = req.query.q || ''; // Get search keyword from query string
        const filters = {}; // You can add logic to extract filters from req.query if needed
        const excludeProductId = null; // No product to exclude in this context
        const limit = 9; // Default limit

        // Find products based on search query and filters
        const products = await findProducts(searchQuery, filters, excludeProductId, limit);

        // Calculate discounted price (if any)
        const productsWithDiscount = products.map(product => ({
            ...product,
            discountedPrice: product.promotion
                ? (product.price * (1 - product.promotion / 100))
                : null,
        }));

        res.render('product', { products: productsWithDiscount, query: searchQuery, title: 'Products' });
    } catch (err) {
        console.error("Error in getProduct:", err);
        res.status(500).send("Error retrieving products");
    }
};

var searchFilter = async (req, res) => {
    try {
        const searchQuery = req.query.q || ''; // Get search keyword from query string
        const filters = req.body.filters || {}; // Get filters from request body
        const excludeProductId = req.body.excludeProductId || null; // Get excludeProductId from request body
        const limit = req.body.limit || 9; // Get limit from request body

        // console.log("searchQuery:", searchQuery);
        // console.log("filters:", filters);
        // console.log("excludeProductId:", excludeProductId);
        // console.log("limit:", limit);

        // Find products based on search query and filters
        const products = await findProducts(searchQuery, filters, excludeProductId, limit);

        // Calculate discounted price (if any)
        const productsWithDiscount = products.map(product => ({
            ...product,
            discountedPrice: product.promotion
                ? (product.price * (1 - product.promotion / 100))
                : null,
        }));

        //res.json(productsWithDiscount);
        res.render('product', { products: productsWithDiscount, query: searchQuery, title: 'Products' });
    } catch (err) {
        console.error("Error in getProductJson:", err);
        res.status(500).send("Error retrieving products");
    }
};

var showProductDetails = async (req, res) => {
    try {
        var productName = req.params.name;
        var product = await getDescriptionByProductName(productName);

        if (!product) {
            return res.status(400).render("error", { message: "Product not found" });
        }

        var disPrice = product.promotion
            ? (product.price * (1 - product.promotion / 100))
            : null;

        var relevantProducts = await getRelevantProducts(product.brand, product.id);

        relevantProducts = relevantProducts.map(product => ({
            ...product,
            discountedPrice: product.promotion
                ? (product.price * (1 - product.promotion / 100))
                : null,
        }));

        res.render('product-detail', { product, disPrice, relevantProducts });
    } catch (error) {
        console.error("Error in showProductDetails:", error);
        res.status(500).send("Internal Server Error");
    }
};

const getFilteredProducts = async (req, res) => {
    try {
        const filters = req.query;
        const page = parseInt(filters.page, 10) || 1; // Get page number from query string, default to 1 if not provided
        const sortOrder = filters.sort || ''; // Get sort order from query string, default to 'asc' if not provided

        // Remove trailing characters like GB, Hz and convert to integers if they exist
        if (filters.ram) filters.ram = parseInt(filters.ram.replace(/GB$/, ''), 10);
        if (filters.storage) filters.disk = parseInt(filters.storage.replace(/GB$/, ''), 10);
        if (filters['refresh rate']) filters.refreshRate = parseInt(filters['refresh rate'].replace(/Hz$/, ''), 10);
        delete filters.storage;
        delete filters['refresh rate'];
        delete filters.page;
        delete filters.sort;

        const data = await getProductsByFilters(filters, page, sortOrder);
        const products = data.products;
        const totalPages = data.totalPages;

        res.json({
            success: true,
            products,
            totalPages
        });
    } catch (error) {
        console.error('Error fetching filtered products:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
}

module.exports = { getProduct, showProductDetails, searchFilter, getFilteredProducts };
