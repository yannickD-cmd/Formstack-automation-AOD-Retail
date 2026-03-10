const express = require('express');
const router = express.Router();
const { supabase } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (!admin) return res.status(403).json({ error: 'Not an admin' });

  res.json({ admin });
});

module.exports = router;
