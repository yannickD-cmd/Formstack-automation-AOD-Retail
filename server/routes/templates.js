const express = require('express');
const router = express.Router();
const { verifyToken, supabase } = require('../middleware/auth');

router.use(verifyToken);

// List templates
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('admin_id', req.admin.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Create template
router.post('/', async (req, res) => {
  const { name, subject, body, formstack_url } = req.body;
  const { data, error } = await supabase
    .from('email_templates')
    .insert({ admin_id: req.admin.id, name, subject, body, formstack_url: formstack_url || null })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Update template
router.put('/:id', async (req, res) => {
  const { name, subject, body, formstack_url } = req.body;
  const { data, error } = await supabase
    .from('email_templates')
    .update({ name, subject, body, formstack_url: formstack_url || null, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('admin_id', req.admin.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete template
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', req.params.id)
    .eq('admin_id', req.admin.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
