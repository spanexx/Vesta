import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Admin not found'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired token'
    });
  }
};

export const checkAdminPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin.permissions[permission]) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `You do not have ${permission} permission`
      });
    }
    next();
  };
};
