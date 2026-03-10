const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Look up admin record
  const { data: admin, error: adminErr } = await supabase
    .from('admins')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (adminErr || !admin) {
    return res.status(403).json({ error: 'Not an admin' });
  }

  req.user = user;
  req.admin = admin;
  next();
}

module.exports = { verifyToken, supabase };
