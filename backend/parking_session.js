const mongoose = require("mongoose");

const parkingSessionSchema = new mongoose.Schema({
  car: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Car", 
    required: true 
  },
  startTime: { 
    type: Date, 
    default: Date.now 
  },
  endtTime: { 
    type: Date 
  },
  fee: { 
    type: Number, 
    default: 0 
  },
  paid : {
    type : Boolean,
    default : false
  }
});

module.exports = mongoose.model("ParkingSession", parkingSessionSchema);