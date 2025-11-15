const mongoose = require("mongoose");


const carSchema = new mongoose.Schema({
  plateNumber: { 
    type: String, 
    required: true,       
    unique: true,         
  },
  ownerName: { 
    type: String, 
    required: true       
  },
  qrId: { 
    type: String, 
    required: true, 
    unique: true         
  },
  visaAccount: { 
    type: String, 
    required: true        
  }
});

module.exports = mongoose.model("Car", carSchema);