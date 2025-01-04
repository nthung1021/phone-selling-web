const express = require("express");
const { createOrder, getUserOrders, getCheckout, getConfirmation, getOrderDetails } = require("./orderController");
const router = express.Router();

router.post("/create", createOrder);
router.get("/history", getUserOrders);
router.get("/checkout", getCheckout);
router.get("/confirmation", getConfirmation);
router.get("/:orderId", getOrderDetails);   

module.exports = router;
