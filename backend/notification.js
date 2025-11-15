const mongoose = require("mongoose");


const notificationSchema = new mongoose.Schema({
  fromCar: { 
    type: mongoose.Schema.Types.ObjectId,  
    ref: "Car",                            
    required: true                         
  },
  toCar: { 
    type: mongoose.Schema.Types.ObjectId,  
    ref: "Car",                            
    required: true                         
  },
  message: { 
    type: String,                          
    required: true                         
  },
  timestamp: { 
    type: Date, 
    default: Date.now                     
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
