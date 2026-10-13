const router = require("express").Router();
const auth = require("../middleware/auth");
const { validate, validateObjectId } = require("../middleware/validate");
const schemas = require("../validators/schemas");
const c = require("../controllers/rideController");

router.use(auth);
router.param("id", validateObjectId);

router.post("/", validate(schemas.createRide), c.createRide);
router.get("/", c.searchRides); // ?date=YYYY-MM-DD&destination=...
router.get("/mine", c.getMyRides);
router.put("/:id", validate(schemas.updateRide), c.updateRide);
router.delete("/:id", c.deleteRide);

module.exports = router;
