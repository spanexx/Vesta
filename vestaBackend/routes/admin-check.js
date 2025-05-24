// Test endpoint to check if admin exists
router.get('/check-admin', async (req, res) => {
  try {
    const adminEmail = process.env.MAIN_ADMIN_EMAIL || 'admin@vesta.com';
    const admin = await Admin.findOne({ email: adminEmail });
    
    if (admin) {
      res.json({
        message: 'Admin exists',
        email: admin.email,
        username: admin.username,
        exists: true
      });
    } else {
      res.json({
        message: 'Admin does not exist',
        exists: false
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'CHECK_FAILED',
      message: error.message
    });
  }
});
