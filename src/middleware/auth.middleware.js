// src/middleware/auth.middleware.js
export const roleAuthenticate = (roles) => {
  return (req, res, next) => {
    if (req.isAuthenticated()) {
      if (roles.includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({ message: 'Unauthorized' });
    } else {
      return res.redirect('/login');
    }
  };
}
