import UserProfile from '../models/UserProfile.js';



const checkUserStatus = async (req, res, next) => {
    try {
      const profile = await UserProfile.findById(req.params.userId);
      if (!profile) {
        return res.status(404).json({
          error: 'PROFILE_NOT_FOUND',
          message: 'Profile not found'
        });
      }
  
      console.log(profile.status);
      
      if (profile.status === 'pending') {
       
        return res.status(403).json({
          error: 'PENDING_STATUS',
          message: 'Your account is pending verification. You cannot upload content at this time.'
        });
      }
      next();
    } catch (error) {
      next(error);
    }
    
    };
  
    export default checkUserStatus;