const express = require('express');
const router = express.Router();
const { verifyToken, supabase } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/encryption');
const { createTransport } = require('../services/emailService');

router.use(verifyToken);

// Get SMTP settings
router.get('/smtp', async (req, res) => {
  const { data, error } = await supabase
    .from('smtp_settings')
    .select('*')
    .eq('admin_id', req.admin.id)
    .single();

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });

  if (data) {
    // Don't send the encrypted password to the frontend
    data.password_encrypted = '••••••••';
  }

  res.json(data || null);
});

// Update SMTP settings
router.put('/smtp', async (req, res) => {
  const { host, port, username, password, sender_name, sender_email } = req.body;

  const payload = {
    admin_id: req.admin.id,
    host: host || 'smtp.gmail.com',
    port: port || 587,
    username,
    password_encrypted: encrypt(password),
    sender_name,
    sender_email,
    updated_at: new Date().toISOString()
  };

  const { data: existing } = await supabase
    .from('smtp_settings')
    .select('id')
    .eq('admin_id', req.admin.id)
    .single();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('smtp_settings')
      .update(payload)
      .eq('admin_id', req.admin.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    result = data;
  } else {
    const { data, error } = await supabase
      .from('smtp_settings')
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    result = data;
  }

  result.password_encrypted = '••••••••';
  res.json(result);
});

// Test SMTP connection
router.post('/smtp/test', async (req, res) => {
  const { data: smtp } = await supabase
    .from('smtp_settings')
    .select('*')
    .eq('admin_id', req.admin.id)
    .single();

  if (!smtp) return res.status(400).json({ error: 'SMTP not configured' });

  try {
    const transporter = await createTransport(smtp);
    await transporter.sendMail({
      from: `"${smtp.sender_name}" <${smtp.sender_email}>`,
      to: req.admin.email,
      subject: 'SMTP Test — Email Template System',
      html: '<p>Your SMTP connection is working correctly!</p>'
    });
    res.json({ success: true, message: 'Test email sent to ' + req.admin.email });
  } catch (err) {
    res.status(500).json({ error: 'SMTP test failed: ' + err.message });
  }
});

module.exports = router;
