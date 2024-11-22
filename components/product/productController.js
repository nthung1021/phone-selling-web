var { getAllProducts, getDescriptionByProductName } = require('./productModel');

var getProduct = async (req, res) => {
    try {
        var products = await getAllProducts();
    
        res.render('product', {products, title: 'GA05 - Products' } );
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving products");
    }
};

var showProductDetails = async (req, res) => {
    try {
        var productName = req.params.name.replace(/-/g, " ").toUpperCase();
        var des = await getDescriptionByProductName(productName);
        
        if (!des) {
            return res.status(400).render("error", { message: "Invalid product name" });
        }

        res.render("product-detail", {
            product: des,
            detail: des.Detail[0]
        });
    } catch (error) {
        console.error("Error in showProductDetails:", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { getProduct, showProductDetails };
  