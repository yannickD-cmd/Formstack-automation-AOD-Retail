function replacePlaceholders(text, client, extra = {}) {
  let result = text
    .replace(/\{\{first_name\}\}/g, client.first_name || '')
    .replace(/\{\{last_name\}\}/g, client.last_name || '')
    .replace(/\{\{email\}\}/g, client.email || '')
    .replace(/\{\{company\}\}/g, client.company || '');

  if (extra.formstack_url) {
    const linkHtml = `<a href="${extra.formstack_url}" target="_blank" style="display:inline-block;padding:12px 28px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px;margin:8px 4px;">Fill Out the Form</a>`;
    result = result.replace(/\{\{formstack_link\}\}/g, linkHtml);
  } else {
    result = result.replace(/\{\{formstack_link\}\}/g, '');
  }

  return result;
}

function wrapInEmailTemplate(bodyHtml) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:40px 48px;font-size:16px;line-height:1.7;color:#333333;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = { replacePlaceholders, wrapInEmailTemplate };
