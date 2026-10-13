const router = require("express").Router();
const auth = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const schemas = require("../validators/schemas");
const c = require("../controllers/userController");

router.use(auth);
router.get("/me", c.getMe);
router.put("/me", validate(schemas.updateProfile), c.updateMe);

module.exports = router;
