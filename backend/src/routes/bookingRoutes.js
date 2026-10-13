const router = require("express").Router();
const auth = require("../middleware/auth");
const { validate, validateObjectId } = require("../middleware/validate");
const schemas = require("../validators/schemas");
const c = require("../controllers/bookingController");

router.use(auth);
router.param("id", validateObjectId);

router.post("/", validate(schemas.createBooking), c.createBooking);
router.get("/mine", c.getMyBookings);
router.get("/received", c.getReceivedBookings);
router.patch("/:id", validate(schemas.bookingStatus), c.updateBookingStatus);
router.delete("/:id", c.cancelBooking);

module.exports = router;
