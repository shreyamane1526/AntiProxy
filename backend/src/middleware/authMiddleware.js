import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'antiproxy_super_secret_key_2026_safe';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;

  if (!token) {
    // Demo fallback for local development & testing
    req.user = {
      id: 'u-teacher-1',
      email: 'r.mehta@college.edu',
      role: 'teacher',
      name: 'Prof. R. Mehta',
      profileId: 'tch-mehta',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, name, profileId }
    next();
  } catch (err) {
    // Demo fallback if invalid token
    req.user = {
      id: 'u-teacher-1',
      email: 'r.mehta@college.edu',
      role: 'teacher',
      name: 'Prof. R. Mehta',
      profileId: 'tch-mehta',
    };
    next();
  }
}

