const {
    addOrUpdateCartItem,
    getCartItems,
    updateCartItemQuantity,
    deleteCartItemById
} = require('./cartModel');

const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = req.user ? req.user.id : null; // User ID if logged in
    const sessionId = req.sessionID; // Session ID for guests

    try {
        const cartItem = await addOrUpdateCartItem(userId, sessionId, productId, quantity);
        res.json(cartItem);
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).send("Internal server error");
    }
};

const getCart = async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID;

    try {
        const cartItems = await getCartItems(userId, sessionId);

        const cartItemsWithDetails = cartItems.map(item => {
            const discountedPrice = item.Product.promotion
                ? (item.Product.price * (1 - item.Product.promotion / 100))
                : item.Product.price;

            return {
                ...item,
                Product: {
                    ...item.Product,
                    discountedPrice: discountedPrice,
                },
                totalPrice: (discountedPrice * item.quantity),
                incrementedQuantity: item.quantity + 1,
                decrementedQuantity: item.quantity - 1
            };
        });

        const subtotal = cartItemsWithDetails.reduce(
            (sum, item) => sum + parseFloat(item.totalPrice),
            0
        );

        const isGuest = !userId;

        res.render('cart', {
            cartItems: cartItemsWithDetails,
            subtotal: subtotal,
            isGuest
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send('Internal server error');
    }
};

const updateCartItem = async (req, res) => {
    const { id, quantity } = req.body;

    try {
        const cartItem = await updateCartItemQuantity(id, quantity);
        res.json(cartItem);
    } catch (error) {
        console.error("Error updating cart item:", error);
        res.status(500).send("Internal server error");
    }
};

const deleteCartItem = async (req, res) => {
    const { id } = req.params;

    try {
        await deleteCartItemById(parseInt(id));
        res.sendStatus(204);
    } catch (error) {
        console.error("Error deleting cart item:", error);
        res.status(500).send("Internal server error");
    }
};

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    deleteCartItem
}
