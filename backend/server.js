const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;


app.use(cors());
app.use(bodyParser.json());


mongoose.connect("mongodb://127.0.0.1:27017/parklinkDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));


const Car = require("./models/car");
const ParkingSession = require("./models/parking_session");
const Payment = require("./models/payment");
const Notification = require("./models/notification");
//route for start parking 
app.post("/api/start-parking", async (req, res) => {
  try {
    const { carId } = req.body;
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({
        status: "error",
        message: " Car not found"
      });
    }

    const newSession = new ParkingSession({
      car: car._id,
      startTime: new Date()
    });

    await newSession.save();

    res.json({
      status: "success",
      message: " Parking session started successfully!",
      data: newSession
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: " Error starting parking session",
      data: error.message
    });
  }
});

//route session to end parking 
app.put("/api/end-parking", async (req, res) => {
  try {
    const { carId } = req.body;
    const session = await ParkingSession.findOne({ car: carId }).sort({ startTime: -1 });

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: " No active session found for this car"
      });
    }

    session.endTime = new Date();
    const durationHours = (session.endTime - session.startTime) / (1000 * 60 * 60);
    const ratePerHour = 10;
    const totalFee = Math.ceil(durationHours * ratePerHour);

    session.fee = totalFee;
    await session.save();

    res.json({
      status: "success",
      message: "Parking ended successfully",
      data: {
        durationHours: durationHours.toFixed(2),
        totalFee
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: " Error ending parking session",
      data: error.message
    });
  }
});

//route for paying 
app.post("/api/payment", async (req, res) => {
  try {
    const { carId, visaNumber } = req.body;
    const session = await ParkingSession.findOne({ car: carId }).sort({ startTime: -1 });

    if (!session) {
      return res.status(404).json({
        status: "error",
        message: "❌ No session found for this car"
      });
    }

    const amount = session.fee;

    const newPayment = new Payment({
      car: carId,
      amount,
      visaNumber,
      date: new Date(),
      status: "success"
    });

    await newPayment.save();

    session.paid = true;
    await session.save();

    await Notification.create({
      car: carId,
      message: `💳 Payment of ${amount} EGP successful.`,
      date: new Date()
    });

    res.json({
      status: "success",
      message: "✅ Payment processed successfully",
      data: newPayment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "❌ Error processing payment",
      data: error.message
    });
  }
});

//route to view all sessions 
app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await ParkingSession.find().populate("car");
    res.json({
      status: "success",
      message: "All parking sessions fetched successfully",
      data: sessions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "❌ Error fetching sessions",
      data: error.message
    });
  }
});
//route to view all payments made on website 
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await Payment.find().populate("car");
    res.json({
      status: "success",
      message: "All payments fetched successfully",
      data: payments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: " Error fetching payments",
      data: error.message
    });
  }
});




app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find().populate("car");
    res.json({
      status: "success",
      message: "All notifications fetched successfully",
      data: notifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: " Error fetching notifications",
      data: error.message
    });
  }
});

//route to send another driver a message
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
        message: " Target car not found"
      });
    }

    const newNotification = await Notification.create({
      car: targetCarId,
      message,
      date: new Date()
    });

    res.json({
      status: "success",
      message: " Notification sent successfully to the driver",
      data: newNotification
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: " Error sending notification",
      data: error.message
    });
  }
});


app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: " ParkLink backend is running successfully!"
  });
});


app.get("/test", (req, res) => {
  res.status(200).json({
    status: "success",
    message: " Test route working fine"
  });
});


app.listen(PORT, "localhost", () => {
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});