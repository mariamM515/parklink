const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
mongoose.connect("mongodb://127.0.0.1:27017/parklinkDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected successfully"))
.catch((err) => console.log("MongoDB connection error:", err));

// Models
const Car = require("./models/car");
const ParkingSession = require("./models/parking_session");
const Payment = require("./models/payment");
const Notification = require("./models/notification");



// =========================================================
// GET CAR INFO BY QR ID
// =========================================================
app.get("/api/car-info/:qrId", async (req, res) => {
  try {
    const qrId = req.params.qrId;
    const car = await Car.findOne({ qrId: qrId });

    if (!car) {
      return res.status(404).json({
        status: "error",
        message: "Car not found for this QR ID"
      });
    }

    res.json({
      status: "success",
      message: "Car found successfully",
      data: car
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching car info",
      data: error.message
    });
  }
});



// =========================================================
// START SESSION (QR)
// =========================================================
app.post("/api/start-session/:qrId", async (req, res) => {
  try {
    const qrId = req.params.qrId;
    const car = await Car.findOne({ qrId: qrId });

    if (!car) {
      return res.status(404).json({
        status: "error",
        message: "Car not found"
      });
    }

    const session = new ParkingSession({
      car: car._id,
      entryTime: new Date()
    });

    await session.save();

    res.json({
      status: "success",
      message: "Parking session started",
      data: session
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error starting session",
      data: error.message
    });
  }
});



// =========================================================
// END SESSION (QR)
// =========================================================
app.put("/api/end-session/:qrId", async (req, res) => {
  try {
    const qrId = req.params.qrId;
    const car = await Car.findOne({ qrId: qrId });

    if (!car) {
      return res.status(404).json({
        status: "error",
        message: "Car not found"
      });
    }

    const session = await ParkingSession.findOne({
      car: car._id,
      exitTime: null
    });

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "No active session found"
      });
    }

    session.exitTime = new Date();

    const durationToMinutes = (session.exitTime - session.entryTime) / (1000 * 60);
    const fee = Math.ceil(durationToMinutes) * 10;

    session.fee = fee;
    await session.save();

    res.json({
      status: "success",
      message: "Parking session ended",
      data: {
        duration: durationToMinutes,
        fee: fee
      }
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error ending session",
      data: error.message
    });
  }
});



// =========================================================
// SCAN (ENTER OR EXIT)
// =========================================================
app.get("/api/scan/:qrId", async (req, res) => {
  try {
    const qrId = req.params.qrId;

    const car = await Car.findOne({ qrId: qrId });

    if (!car) {
      return res.status(404).json({
        status: "error",
        message: "Car not found"
      });
    }

    const session = await ParkingSession.findOne({
      car: car._id,
      exitTime: null
    });

    if (!session) {
      return res.json({
        status: "entering",
        message: "Car is entering",
        data: car
      });
    }

    return res.json({
      status: "exiting",
      message: "Car is exiting",
      data: session
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error scanning QR",
      data: error.message
    });
  }
});



// =========================================================
// PAYMENT ROUTE
// =========================================================
app.post("/api/payment", async (req, res) => {
  try {
    const { sessionId, visaNumber } = req.body;

    const session = await ParkingSession.findById(sessionId).populate("car");

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "Session not found"
      });
    }

    if (session.paid === true) {
      return res.status(400).json({
        status: "error",
        message: "Session already paid"
      });
    }

    const amount = session.fee;

    const payment = new Payment({
      car: session.car._id,
      sessionId: session._id,
      amount: amount,
      visaNumber: visaNumber,
      status: "success"
    });

    await payment.save();

    session.paid = true;
    await session.save();

    res.json({
      status: "success",
      message: "Payment completed successfully",
      data: {
        payment: payment,
        session: session
      }
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error processing payment",
      data: error.message
    });
  }
});



// =========================================================
// SEND NOTIFICATION
// =========================================================
app.post("/api/notify", async (req, res) => {
  try {
    const { targetCarId, message } = req.body;

    if (!targetCarId || !message) {
      return res.status(400).json({
        status: "error",
        message: "targetCarId and message are required"
      });
    }

    const targetCar = await Car.findById(targetCarId);

    if (!targetCar) {
      return res.status(404).json({
        status: "error",
        message: "Target car not found"
      });
    }

    const notification = await Notification.create({
      car: targetCarId,
      message,
      date: new Date()
    });

    res.json({
      status: "success",
      message: "Notification sent successfully",
      data: notification
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error sending notification",
      data: error.message
    });
  }
});



// =========================================================
// VIEW NOTIFICATIONS
// =========================================================
app.get("/api/notifications", async (req, res) => {
  try {
    const carId = req.query.carId;

    if (!carId) {
      return res.status(400).json({
        status: "error",
        message: "carId is required"
      });
    }

    const notifications = await Notification.find({ car: carId }).sort({ date: -1 });

    res.json({
      status: "success",
      message: "Notifications fetched successfully",
      data: notifications
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching notifications",
      data: error.message
    });
  }
});



// =========================================================
// ADMIN: ALL SESSIONS
// =========================================================
app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await ParkingSession.find()
      .populate("car")
      .sort({ entryTime: -1 });

    res.json({
      status: "success",
      message: "All parking sessions fetched",
      data: sessions
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching sessions",
      data: error.message
    });
  }
});



// =========================================================
// ADMIN: ALL PAYMENTS
// =========================================================
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("car")
      .populate("sessionId")
      .sort({ date: -1 });

    res.json({
      status: "success",
      message: "All payments fetched",
      data: payments
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching payments",
      data: error.message
    });
  }
});



// =========================================================
// TEST ROUTES
// =========================================================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "ParkLink backend is running successfully!"
  });
});

app.get("/test", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Test route working fine"
  });
});



// =========================================================
// SERVER START
// =========================================================
app.listen(PORT, "localhost", () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
