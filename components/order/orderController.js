const {
    createOrder,
    getOrdersByUserId,
    clearCartAfterOrder,
    getOrderDetailByOrderId
} = require('./orderModel');

const { getCartItems } = require('../cart/cartModel'); // Import the function to fetch cart items
  
const createOrder = async (req, res) => {
    const {
        name,
        email,
        address,
        comment,
        deliveryMethod,
        cardNumber,
        cardHolder,
        cardExpire,
        cardCVV,
    } = req.body;

    const userId = req.user ? req.user.id : null;
    const sessionId = req.sessionID;

    try {
        const cartItems = await getCartItems(userId, sessionId); // Ensure valid cart items
        const shippingFee = calculateShippingFee(deliveryMethod);
        const subtotal = calculateSubtotal(cartItems);
        const totalAmount = subtotal + shippingFee;

        console.log("Delivery Method:", deliveryMethod);
        console.log("Shipping Fee:", shippingFee);
        console.log("Subtotal:", subtotal);
        console.log("Total Amount:", totalAmount);

        await createOrder(userId, sessionId, cartItems, deliveryMethod, {
            name,
            email,
            address,
            comment,
            cardNumber,
            cardHolder,
            cardExpire,
            cardCVV,
            totalAmount,
            shippingFee,
        });

        await clearCartAfterOrder(userId, sessionId);
        req.session.cart = []; // Clear cart after placing order
        res.redirect("/order/confirmation");
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).send("Internal server error");
    }
};
  
const formatDate = (date) => {
    const options = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    };
    return new Intl.DateTimeFormat("en-CA", options).format(new Date(date)).replace(/,/g, "").replace(/:/g, "-");
};

const getUserOrders = async (req, res) => {
    try {
        const orders = await getOrdersByUserId(req.user.id);

        // Format dates
        const formattedOrders = orders.map((order) => ({
            ...order,
            formattedDate: formatDate(order.createdAt), // Add formatted date
        }));

        res.render("order-history", { title: "Order History", orders: formattedOrders, user: req.user });
    } catch (error) {
        console.error("Error fetching order history:", error);
        res.status(500).send("Internal server error");
    }
};


const getCheckout = async (req, res) => {
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
                    discountedPrice,
                },
                totalPrice: discountedPrice * item.quantity,
            };
        });

        const subtotal = cartItemsWithDetails.reduce(
            (sum, item) => sum + parseFloat(item.totalPrice),
            0
        );

        const deliveryMethods = [
            { name: "Turbo, 6 hours", cost: 50000, description: "Express shipping service ensures goods are delivered within the same day, however delivery costs will be more expensive than other methods and only apply within the city." },
            { name: "Fast, 1-2 hours", cost: 25000, description: "This shipping service ensures goods are delivered within 1 to 2 days from the date the shipping unit receives the goods from the seller, but the price will be cheaper. Vouchers cannot be used to apply free shipping for this form." },
            { name: "Economical, 3-4 days", cost: 10000, description: "This shipping method ensures savings in delivery costs but delivery time will be longer. Vouchers can be used to apply for free shipping." },
            { name: "Free, 7 days", cost: 0, description: "This form applies to all types of orders with a commitment to no additional shipping fees. However, the shipping unit will not prioritize delivery and orders will be stored for a maximum of 5 days and will be shipped within the next 2 to 3 days." },
        ];

        res.render('checkout-info', {
            title: "Checkout",
            cartItems: cartItemsWithDetails,
            subtotal: subtotal.toLocaleString("en-US"),
            deliveryMethods,
        });
    } catch (error) {
        console.error("Error fetching cart items for checkout:", error);
        res.status(500).send("Internal server error");
    }
};

const getConfirmation = async (req, res) => {
    res.render("checkout-confirmation", {title: "Confirmation", user: req.user});
};

const calculateShippingFee = (deliveryMethod) => {
    if (!deliveryMethod) return 0; // Default to 0 if deliveryMethod is undefined
    if (deliveryMethod.includes("Turbo")) return 50000;
    if (deliveryMethod.includes("Fast")) return 25000;
    if (deliveryMethod.includes("Economical")) return 10000;
    return 0; // Default to 0 if deliveryMethod is Free
};

const calculateSubtotal = (cartItems) => {
    if (!cartItems || !Array.isArray(cartItems)) {
        return 0; // Default subtotal if cart is empty or undefined
    }

    const cartItemsWithDetails = cartItems.map(item => {
        const discountedPrice = item.Product.promotion
            ? (item.Product.price * (1 - item.Product.promotion / 100))
            : item.Product.price;

        return {
            ...item,
            totalPrice: discountedPrice * item.quantity,
        };
    });

    const subtotal = cartItemsWithDetails.reduce(
        (sum, item) => sum + parseFloat(item.totalPrice),
        0
    );

    return subtotal;
};

const getOrderDetails = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await getOrderDetailByOrderId(orderId); // Ensure the function is awaited

        if (!order) {
            return res.status(404).send("Order not found");
        }

        // Preprocess card number
        const maskedCardNumber = order.cardNumber
            ? `**** **** **** ${order.cardNumber.slice(-4)}`
            : "N/A";

        // Calculate subtotal
        const subtotal = order.orderProducts.reduce((sum, item) => {
            const discountedPrice = item.product.promotion
                ? item.product.price * (1 - item.product.promotion / 100)
                : item.product.price;
            return sum + discountedPrice * item.quantity;
        }, 0);

        res.render("order-detail", {
            title: "Order Detail",
            user: req.user,
            order: {
                ...order,
                maskedCardNumber, 
                subtotal,
                formattedDate: formatDate(order.createdAt), // Add formatted date
            },
            products: order.orderProducts.map((item) => ({
                ...item,
                discountedPrice: item.product.promotion
                    ? item.product.price * (1 - item.product.promotion / 100)
                    : item.product.price,
                totalPrice: (
                    (item.product.promotion
                        ? item.product.price * (1 - item.product.promotion / 100)
                        : item.product.price) * item.quantity
                ),
            })),
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).send("Internal server error");
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getCheckout,
    getConfirmation,
    getOrderDetails,
};

  