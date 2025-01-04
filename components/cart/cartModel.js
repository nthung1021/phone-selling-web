const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addOrUpdateCartItem = async (userId, sessionId, productId, quantity) => {
    let cartItem;

    if (userId) {
        cartItem = await prisma.cart.findFirst({
            where: { userId, productId }
        });
    } else {
        cartItem = await prisma.cart.findFirst({
            where: { sessionId, productId }
        });
    }

    if (cartItem) {
        return await prisma.cart.update({
            where: { id: cartItem.id },
            data: { quantity: cartItem.quantity + quantity }
        });
    } else {
        return await prisma.cart.create({
            data: { userId, sessionId, productId, quantity }
        });
    }
};

const getCartItems = async (userId, sessionId) => {
    return await prisma.cart.findMany({
        where: {
            OR: [{ userId }, { sessionId }],
        },
        include: {
            Product: true, // Ensure Product is included
        },
    });
};

const updateCartItemQuantity = async (id, quantity) => {
    return await prisma.cart.update({
        where: { id },
        data: { quantity }
    });
};

const deleteCartItem = async (id) => {
    return await prisma.cart.delete({ where: { id } });
};

module.exports = {
    addOrUpdateCartItem,
    getCartItems,
    updateCartItemQuantity,
    deleteCartItem
};
