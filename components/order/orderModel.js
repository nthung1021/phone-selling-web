const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addOrder = async (userId, sessionId, cartItems, deliveryMethod, data) => {
    return await prisma.order.create({
        data: {
            user: userId ? { connect: { id: userId } } : undefined, // Use `connect` for the user relation
            sessionId,
            deliveryMethod,
            paymentMethod: "Card",
            totalAmount: data.totalAmount,
            shippingFee: data.shippingFee,
            address: data.address,
            email: data.email,
            comment: data.comment,
            cardNumber: data.cardNumber,
            cardHolder: data.cardHolder,
            cardExpire: data.cardExpire,
            cardCVV: data.cardCVV,
            orderProducts: {
                create: cartItems.map((item) => ({
                    productId: item.Product.id,
                    quantity: item.quantity,
                })),
            },
        },
    });
};
  

const getOrdersByUserId = async (userId) => {
    return await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            orderProducts: true,
        },
    });
};

const clearCartAfterOrder = async (userId, sessionId) => {
    return await prisma.cart.deleteMany({
        where: {
        OR: [{ userId }, { sessionId }],
        },
    });
};

const getOrderDetailByOrderId = async (orderId) => {
    return prisma.order.findUnique({
        where: { id: parseInt(orderId, 10) },
        include: {
            orderProducts: {
                include: {
                    product: true, // Include product details
                },
            },
        },
    });
}

module.exports = {
    addOrder,
    getOrdersByUserId,
    clearCartAfterOrder,
    getOrderDetailByOrderId
};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addOrder = async (userId, sessionId, cartItems, deliveryMethod, data) => {
    return await prisma.order.create({
        data: {
            user: userId ? { connect: { id: userId } } : undefined, // Use `connect` for the user relation
            sessionId,
            deliveryMethod,
            paymentMethod: "Card",
            totalAmount: data.totalAmount,
            shippingFee: data.shippingFee,
            address: data.address,
            email: data.email,
            comment: data.comment,
            cardNumber: data.cardNumber,
            cardHolder: data.cardHolder,
            cardExpire: data.cardExpire,
            cardCVV: data.cardCVV,
            orderProducts: {
                create: cartItems.map((item) => ({
                    productId: item.Product.id,
                    quantity: item.quantity,
                })),
            },
        },
    });
};
  

const getOrdersByUserId = async (userId) => {
    return await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            orderProducts: true,
        },
    });
};

const clearCartAfterOrder = async (userId, sessionId) => {
    return await prisma.cart.deleteMany({
        where: {
        OR: [{ userId }, { sessionId }],
        },
    });
};

const getOrderDetailByOrderId = async (orderId) => {
    return prisma.order.findUnique({
        where: { id: parseInt(orderId, 10) },
        include: {
            orderProducts: {
                include: {
                    product: true, // Include product details
                },
            },
        },
    });
}

module.exports = {
    addOrder,
    getOrdersByUserId,
    clearCartAfterOrder,
    getOrderDetailByOrderId
};
