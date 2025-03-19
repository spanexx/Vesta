import mongoose from 'mongoose';

const manualPaymentDataSchema = new mongoose.Schema({
  plan: { type: String },
  amount: { type: String },
  interval: { type: String },
  username: { type: String },
  email: { type: String },
  image: { type: String }
}, { timestamps: true });

export default mongoose.model('ManualPaymentData', manualPaymentDataSchema);
