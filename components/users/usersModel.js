var { PrismaClient } = require('@prisma/client');
var prisma = new PrismaClient();

var findUserByUsername = async (username) => {
    if (!username) {
        throw new Error('Username is required');
    }

    return prisma.user.findUnique({ where: { username } });
};

var findUserByEmail = async (email) => {
    if (!email) {
        throw new Error('Email is required');
    }
    return prisma.user.findFirst({ where: { email, googleId: null } });  
};

var createUser = async (username, email, hashedPassword) => {
    return prisma.user.create({
        data: { username: username, email: email, password: hashedPassword },
    });
};

var addTokenAndExpire = async (username, email, resetToken, expires) => {
    if (!email) {
        throw new Error('Email is required');
    }
    return prisma.user.update({
        where: { email, username, googleId: null },
        data: {
            resetPasswordToken: resetToken,
            resetPasswordExpires: expires,
        },
    });
};

var findTokenAndExpire = async (token) => {
    if (!token) {
        throw new Error('Reset-password token is empty');
    }
    return prisma.user.findFirst({
        where: {
            resetPasswordToken: token,
            resetPasswordExpires: {
                gte: new Date(), // Token chưa hết hạn
            },
        },
    });
};

var updateUsername = async (userid, username) => {
    if (!username) {
        throw new Error('Username is empty');
    }

    const checkUser = await prisma.user.findFirst({
        where: {
            username,
            id: {not: userid}
        },
    });
    console.log(checkUser);
    // Return null if username already exists
    if (checkUser) return null;

    return prisma.user.update({
        where: {id: userid},
        data: {username},
    });
};

var updateEmail = async (userid, email) => {
    if (!email) {
        throw new Error('Email is empty');
    }
    const checkEmail = await prisma.user.findFirst({
        where: {
            email,
            googleId: null,
            id: {not: userid}
        },
    })
    console.log(checkEmail);
    // Return null if email (not Google Login) already exists
    if (checkEmail) return null;

    return prisma.user.update({
        where: {id: userid},
        data: {email},
    });
};


var updatePhone = async (id, phone) => {
    if (!phone) {
        throw new Error('Phone number is empty');
    }

    return prisma.user.update({
        where: {id},
        data: {phone},
    });
};

var updatePassword = async (userid, hashedPassword) => {
    return prisma.user.update({
        where: { id: userid, googleId: null },
        data: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        },
    });
};

var findOrCreateGoogleUser = async (googleId, username, email) => {
    let user = await prisma.user.findFirst({ where: { googleId } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                googleId,
                username,
                email,
            },
        });
    }
    return user;
};

const updateAvatar = async (userId, imageUrl) => {
    return prisma.user.update({
        where: { id: userId },
        data: { avatar: imageUrl },
    });
};

module.exports = {
    findUserByUsername, createUser, findUserByEmail,
    addTokenAndExpire, findTokenAndExpire, updatePassword, findOrCreateGoogleUser,
    updateUsername, updateEmail, updatePhone, updateAvatar
};
