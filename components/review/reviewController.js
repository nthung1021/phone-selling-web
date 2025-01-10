const { getReviewByProduct, getNumberOfReviewByProduct, createReview } = require("./reviewModel")
const { getProductIdByName } = require("../product/productModel")

const showProductReview = async(req, res) => {
    try {
        const product_name = req.params.name
        const id_product = await getProductIdByName(product_name)
        const currentPage = parseInt(req.query.page) || 1

        const numOfReviews = await getNumberOfReviewByProduct(id_product) // get number of reviews
        const reviews = await getReviewByProduct(id_product, currentPage) // get reviews

        const currentUrl = req.originalUrl;
        const urlToPost = `${currentUrl}/post`;
        const urlToReturn = currentUrl.replace(/\/review$/, "");

        res.render('review', { reviews: reviews, numOfReviews: numOfReviews, urlToPost: urlToPost, urlToReturn: urlToReturn
        })
    } catch(err) {
        console.error("Error in getReview:", err);
        res.status(500).send("Error retrieving reviews");
    }
}

const postProductReview = async(req, res) => {
    const product_name = req.params.name
    const id_product = await getProductIdByName(product_name)

    createReview(id_product, req.user.username, req.body.review) // lưu vào database

    // điều hướng trở lại trang review của sản phẩm
    const originalUrl = req.originalUrl;
    const newUrl = originalUrl.replace('/post', '');
    res.redirect(newUrl);
}

module.exports = { showProductReview, postProductReview }