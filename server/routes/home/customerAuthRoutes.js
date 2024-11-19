const router = require("express").Router();
const path = require("path");

const customerAuthController = require("../../controllers/home/customerAuthController");

const _dirname = path.resolve(path.dirname(""));

router.post("/google", customerAuthController.google);
router.post(
  "/customer/customer-register",
  customerAuthController.customer_register
);
router.post("/customer/customer-login", customerAuthController.customer_login);
router.get("/verify/:userId/:token", customerAuthController.verify_email);
router.get("/verified", (req, res) => {
  res.sendFile(path.join(_dirname, "./views/build", "index.html"));
});

//PASSWORD_RESET
router.post("/reset-password", customerAuthController.change_Password);
router.post("/request-passwordreset", customerAuthController.request_password);
router.get(
  "/reset-password/:userId/:token",
  customerAuthController.reset_Password
);
router.get("/resetpassword", (req, res) => {
  res.sendFile(path.join(_dirname, "./views/build", "index.html"));
});
router.get("/customer/logout", customerAuthController.customer_logout);
module.exports = router;
