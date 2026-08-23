/**
 * Role Authorization Middleware
 * Enforces role-based authorization rules.
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User context missing' });
    }

    const userRole = req.user.role.toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Access denied. Requires one of [${allowedRoles.join(', ')}] permissions. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}
