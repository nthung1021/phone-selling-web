var {getFeaturedProducts} = require("./indexModel");

var showFeaturedProducts = async (req, res) => {
    try {
        var featuredProducts = await getFeaturedProducts();

        featuredProducts = featuredProducts.map(product => ({
            ...product,
            discountedPrice: product.promotion
            ? (product.price * (1 - product.promotion / 100)).toFixed(2)
            : null,
        }));

        res.render('index', {featuredProducts, title: "GA05 - Home"});
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Something went wrong' });
    }
}

module.exports = {showFeaturedProducts};