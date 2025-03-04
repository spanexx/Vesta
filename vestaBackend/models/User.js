import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
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
  birthdate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        const age = new Date().getFullYear() - v.getFullYear();
        return age >= 18;
      },
      message: 'User must be at least 18 years old'
    }
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'pending'
  },
  role: {
    type: String,
    enum: ['girlfriend', 'wife', 'mistress', 'pornstar','onenight'],
    default: 'onenight'
  },
  level: {
    type: String,
    enum: ['vip', 'regular']
  },
  lastLogin: Date,
  verificationDocuments: [String],
  emergencyContact: {
    name: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    relationship: {
      type: String
    }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    if (!this.password) {
      return next(new Error('Password is required'));
    }
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

export default mongoose.model('User', userSchema);