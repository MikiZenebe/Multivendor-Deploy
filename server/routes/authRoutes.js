const router = require("express").Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const authControllers = require("../controllers/authControllers");
const path = require("path");

const _dirname = path.resolve(path.dirname(""));

router.post("/seller-google", authControllers.google);
router.post("/admin-register", authControllers.admin_register);
router.post("/admin-login", authControllers.admin_login);
router.get("/get-user", authMiddleware, authControllers.getUser);
router.post("/seller-register", authControllers.seller_register);
router.post("/seller-login", authControllers.seller_login);
router.get("/seller-verify/:userId/:token", authControllers.verify_email);
router.get("/verified", (req, res) => {
  res.sendFile(path.join(_dirname, "./views/build", "index.html"));
});
router.post(
  "/profile-image-upload",
  authMiddleware,
  authControllers.profile_image_upload
);
router.post(
  "/profile-info-add",
  authMiddleware,
  authControllers.profile_info_add
);

router.get("/logout", authMiddleware, authControllers.logout);

module.exports = router;
