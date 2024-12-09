var { getAllProducts, getDescriptionByProductName, getRelevantProducts, findFilteredProducts, findProductsBySearchQuery } = require('./productModel');

const LIMIT = 4 // products in 1 page

var getProduct = async (req, res) => {
    try {
        const query = req.query.q || ''; // Get search keyword from query string
        const page = parseInt(req.query.page || '1') // get page  

        let data;

        if (query) {
            // If any search keyword found, find product based on query
            data = await findProductsBySearchQuery(query, page, LIMIT);
        } else {
            // If no search keyword found, get all products
            data = await getAllProducts(page, LIMIT);
        }

        let { products, currentPage, totalProducts, totalPages } = data // lấy dữ liệu từ data

        // Calculate discounted price (if any)
        products = products.map(product => ({
            ...product,
            discountedPrice: product.promotion
                ? (product.price * (1 - product.promotion / 100)).toFixed(2)
                : null,
        }));

        res.render('product', { 
            products,
            query,
            title: 'GA05 - Products',
            currentPage,
            totalProducts,
            totalPages
         });
    } catch (err) {
        console.error("Error in getProduct:", err);
        res.status(500).send("Error retrieving products");
    }
};

var showProductDetails = async (req, res) => {
    try {
        var productName = req.params.name.replace(/-/g, " ").toUpperCase();
        var product = await getDescriptionByProductName(productName);
        
        if (!product) {
            return res.status(400).render("error", { message: "Product not found" });
        }

        var disPrice = product.promotion
        ? (product.price * (1 - product.promotion / 100)).toFixed(2)
        : null;

        var relevantProducts = await getRelevantProducts(product.category, product.id);

        relevantProducts = relevantProducts.map(product => ({
            ...product,
            discountedPrice: product.promotion
            ? (product.price * (1 - product.promotion / 100)).toFixed(2)
            : null,
        }));

        res.render('product-detail', { product, disPrice, relevantProducts });
    } catch (error) {
        console.error("Error in showProductDetails:", error);
        res.status(500).send("Internal Server Error");
    }
};

const searchFilter = async (req, res) => {
    const filters = req.body;

    try {
        const products = await findFilteredProducts(filters);
        res.json(products);
    } catch (error) {
        console.error('Error fetching filtered products:', error);
        res.status(500).json({ error: 'Server error while fetching products' });
    }
};

module.exports = { getProduct, showProductDetails, searchFilter };
