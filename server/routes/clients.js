const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { verifyToken, supabase } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.use(verifyToken);

// List clients
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('admin_id', req.admin.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add client
router.post('/', async (req, res) => {
  const { first_name, last_name, email, company, tags } = req.body;
  const { data, error } = await supabase
    .from('clients')
    .insert({ admin_id: req.admin.id, first_name, last_name, email, company, tags: tags || [] })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Update client
router.put('/:id', async (req, res) => {
  const { first_name, last_name, email, company, tags } = req.body;
  const { data, error } = await supabase
    .from('clients')
    .update({ first_name, last_name, email, company, tags, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('admin_id', req.admin.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete client
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', req.params.id)
    .eq('admin_id', req.admin.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// CSV import
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const records = parse(req.file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const clients = records.map(r => ({
      admin_id: req.admin.id,
      first_name: r.first_name || r.firstName || '',
      last_name: r.last_name || r.lastName || '',
      email: r.email || '',
      company: r.company || '',
      tags: r.tags ? r.tags.split(',').map(t => t.trim()) : []
    })).filter(c => c.email);

    const { data, error } = await supabase.from('clients').insert(clients).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ imported: data.length });
  } catch (err) {
    res.status(400).json({ error: 'Invalid CSV format' });
  }
});

module.exports = router;
