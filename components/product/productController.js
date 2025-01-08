var { getDescriptionByProductName, getRelevantProducts, getProductsByFiltersAndSearch, getAllProducts } = require('./productModel');

var getProduct = async (req, res) => {
    try {
        const currentPage = parseInt(req.query.page) || 1; // get current page
        const limit = 9; // Default limit

        // Find products based on search query and filters
        const data = await getAllProducts(currentPage, limit);
        const products = data.products;
        const totalPages = data.totalPages;

        // Calculate discounted price (if any)
        const productsWithDiscount = products.map(product => ({
            ...product,
            discountedPrice: product.promotion
                ? (product.price * (1 - product.promotion / 100))
                : null,
        }));

        res.render('product', {
            products: productsWithDiscount,
            currentPage,
            totalPages,
            title: 'Products',
        });
    } catch (err) {
        console.error("Error in getProduct:", err);
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
        // Lấy từ khóa tìm kiếm và các tham số khác từ query
        const searchQuery = req.query.q ? req.query.q.trim() : ''; // Nếu không có từ khóa, để trống
        const page = parseInt(req.query.page, 10) || 1; // Trang hiện tại (mặc định là 1)
        const sortOrder = req.query.sort ? req.query.sort.trim() : ''; // Thứ tự sắp xếp (nếu có)

        // Lấy các bộ lọc từ query string
        const filters = { ...req.query };

        // Xử lý các bộ lọc đặc biệt
        if (filters.ram) {
            filters.ram = parseInt(filters.ram.replace(/GB$/, ''), 10);
        }
        if (filters.storage) {
            filters.disk = parseInt(filters.storage.replace(/GB$/, ''), 10);
            delete filters.storage; // Xóa trường `storage` sau khi chuyển đổi
        }
        if (filters['refresh rate']) {
            filters.refreshRate = parseInt(filters['refresh rate'].replace(/Hz$/, ''), 10);
            delete filters['refresh rate']; // Xóa trường `refresh rate` sau khi xử lý
        }

        // Xóa các tham số không phải bộ lọc
        delete filters.page;
        delete filters.sort;
        delete filters.q;

        // Xử lý khoảng giá
        const priceRanges = {
            "0-5.000.000": [0, 5000000],
            "5.000.000-10.000.000": [5000000, 10000000],
            "10.000.000-20.000.000": [10000000, 20000000],
            "20.000.000-50.000.000": [20000000, 50000000],
            "50.000.000+": [50000000, Infinity]
        };

        if (filters.price) {
            // Đảm bảo `price` luôn là một mảng
            filters.price = Array.isArray(filters.price) ? filters.price : [filters.price];
            filters.price = filters.price.map(priceRange => priceRanges[priceRange] || null).filter(Boolean);
        }

        // Gọi hàm để lấy sản phẩm dựa trên tìm kiếm và bộ lọc
        const data = await getProductsByFiltersAndSearch(searchQuery, filters, page, sortOrder);
        const products = data.products || [];
        const totalPages = data.totalPages || 1;

        // Tính toán giá giảm (nếu có)
        const productsWithDiscount = products.map(product => ({
            ...product,
            discountedPrice: product.promotion
                ? (product.price * (1 - product.promotion / 100))
                : null,
        }));

        // Trả về dữ liệu JSON
        res.render('product', {
            products: productsWithDiscount,
            currentPage: page,
            totalPages,
            query: searchQuery, // Từ khóa tìm kiếm
            title: 'Products',
        });
    } catch (error) {
        console.error('Error in getFilteredProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

const getFilteredProducts_json = async (req, res) => {
    try {
        // Lấy từ khóa tìm kiếm và các tham số khác từ query
        const searchQuery = req.query.q || ''; // Từ khóa tìm kiếm
        const page = parseInt(req.query.page, 10) || 1; // Trang hiện tại (mặc định là 1)
        const sortOrder = req.query.sort || ''; // Thứ tự sắp xếp (nếu có)

        // Lấy các bộ lọc từ query string
        const filters = { ...req.query };

        // Xử lý các bộ lọc đặc biệt
        if (filters.ram) filters.ram = parseInt(filters.ram.replace(/GB$/, ''), 10); // Xử lý RAM
        if (filters.storage) filters.disk = parseInt(filters.storage.replace(/GB$/, ''), 10); // Xử lý lưu trữ
        if (filters['refresh rate']) filters.refreshRate = parseInt(filters['refresh rate'].replace(/Hz$/, ''), 10); // Tần số quét
        delete filters.storage;
        delete filters['refresh rate'];
        delete filters.page;
        delete filters.sort;

        // Xử lý khoảng giá
        const priceRanges = {
            "0-5.000.000": [0, 5000000],
            "5.000.000-10.000.000": [5000000, 10000000],
            "10.000.000-20.000.000": [10000000, 20000000],
            "20.000.000-50.000.000": [20000000, 50000000],
            "50.000.000+": [50000000, Infinity]
        };

        if (filters.price) {
            filters.price = Array.isArray(filters.price) ? filters.price : [filters.price];
            filters.price = filters.price.map(priceRange => priceRanges[priceRange] || null).filter(Boolean);
        }

        // Gọi hàm để lấy sản phẩm dựa trên tìm kiếm và bộ lọc
        const data = await getProductsByFiltersAndSearch(searchQuery, filters, page, sortOrder);
        const products = data.products;
        const totalPages = data.totalPages;

        // Tính toán giá giảm (nếu có)
        const productsWithDiscount = products.map(product => ({
            ...product,
            discountedPrice: product.promotion
                ? (product.price * (1 - product.promotion / 100))
                : null,
        }));

        // Trả về dữ liệu JSON
        res.json({
            success: true,
            products: productsWithDiscount,
            currentPage: page,
            totalPages,
            query: searchQuery, // Từ khóa tìm kiếm
        });
    } catch (error) {
        console.error('Error in getProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

module.exports = { getProduct, showProductDetails, getFilteredProducts, getFilteredProducts_json };
