const mongoose = require("mongoose");


const paymentSchema = new mongoose.Schema({
  car: { 
    type: mongoose.Schema.Types.ObjectId,  
    ref: "Car",                            
    required: true                         
  },
  amount: { 
    type: Number,                        
    required: true                        
  },
  visaNumber : {
    type : String,
    required : true
  },
  date: { 
    type: Date, 
    default: Date.now                     
  },
  status: { 
    type: String, 
    enum: ["success", "failed"],           
    default: "success"                    
  }
});


module.exports = mongoose.model("Payment", paymentSchema);