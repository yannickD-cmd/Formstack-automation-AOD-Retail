const express = require('express');
const router = express.Router();
const { verifyToken, supabase } = require('../middleware/auth');
const { emailLimiter } = require('../middleware/rateLimit');
const { createTransport, sendEmail } = require('../services/emailService');
const { replacePlaceholders, wrapInEmailTemplate } = require('../services/templateEngine');

router.use(verifyToken);

// Send email
router.post('/send', emailLimiter, async (req, res) => {
  const { template_id, client_ids } = req.body;

  // Fetch template
  const { data: template, error: tErr } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', template_id)
    .eq('admin_id', req.admin.id)
    .single();

  if (tErr || !template) return res.status(404).json({ error: 'Template not found' });

  // Fetch clients
  const { data: clients, error: cErr } = await supabase
    .from('clients')
    .select('*')
    .in('id', client_ids)
    .eq('admin_id', req.admin.id);

  if (cErr || !clients.length) return res.status(404).json({ error: 'No clients found' });

  // Fetch SMTP settings
  const { data: smtp, error: sErr } = await supabase
    .from('smtp_settings')
    .select('*')
    .eq('admin_id', req.admin.id)
    .single();

  if (sErr || !smtp) return res.status(400).json({ error: 'SMTP not configured' });

  const transporter = await createTransport(smtp);
  const results = [];

  for (const client of clients) {
    const extra = { formstack_url: template.formstack_url };
    const subject = replacePlaceholders(template.subject, client, extra);
    let bodyHtml = replacePlaceholders(template.body, client, extra);
    // Convert newlines to <br> if the body isn't already wrapped in HTML tags
    if (!bodyHtml.trim().startsWith('<')) {
      bodyHtml = bodyHtml.replace(/\n/g, '<br>');
    }
    const html = wrapInEmailTemplate(bodyHtml);
    const from = `"${smtp.sender_name}" <${smtp.sender_email}>`;

    let status = 'sent';
    let errorMessage = null;

    try {
      await sendEmail(transporter, { from, to: client.email, subject, html });
    } catch (err) {
      status = 'failed';
      errorMessage = err.message;
    }

    const { data: log } = await supabase.from('email_logs').insert({
      admin_id: req.admin.id,
      client_id: client.id,
      template_id: template.id,
      recipient_email: client.email,
      recipient_name: `${client.first_name} ${client.last_name}`,
      subject,
      body: html,
      status,
      error_message: errorMessage
    }).select().single();

    results.push(log);
  }

  res.json({ results });
});

// Preview email
router.post('/preview', async (req, res) => {
  const { template_id, client_id } = req.body;

  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', template_id)
    .eq('admin_id', req.admin.id)
    .single();

  if (!template) return res.status(404).json({ error: 'Template not found' });

  let client = { first_name: 'John', last_name: 'Doe', email: 'john@example.com', company: 'Acme Inc' };

  if (client_id) {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .eq('admin_id', req.admin.id)
      .single();
    if (data) client = data;
  }

  const extra = { formstack_url: template.formstack_url };
  let bodyHtml = replacePlaceholders(template.body, client, extra);
  if (!bodyHtml.trim().startsWith('<')) {
    bodyHtml = bodyHtml.replace(/\n/g, '<br>');
  }
  res.json({
    subject: replacePlaceholders(template.subject, client, extra),
    body: wrapInEmailTemplate(bodyHtml)
  });
});

// Get logs
router.get('/logs', async (req, res) => {
  const { status, from, to } = req.query;

  let query = supabase
    .from('email_logs')
    .select('*')
    .eq('admin_id', req.admin.id)
    .order('sent_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (from) query = query.gte('sent_at', from);
  if (to) query = query.lte('sent_at', to);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;
