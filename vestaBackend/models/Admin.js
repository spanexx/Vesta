import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  permissions: {
    canEditProfiles: { type: Boolean, default: true },
    canDeleteProfiles: { type: Boolean, default: true },
    canModerateContent: { type: Boolean, default: true },
    canManageSubscriptions: { type: Boolean, default: true },
    canCreateAdmin: { type: Boolean, default: false }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  manualPaymentData: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManualPaymentData'
  }]
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Validate password method
adminSchema.methods.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model('Admin', adminSchema);
