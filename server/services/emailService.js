const nodemailer = require('nodemailer');
const { decrypt } = require('../utils/encryption');

async function createTransport(smtpSettings) {
  return nodemailer.createTransport({
    host: smtpSettings.host,
    port: smtpSettings.port,
    secure: smtpSettings.port === 465,
    auth: {
      user: smtpSettings.username,
      pass: decrypt(smtpSettings.password_encrypted)
    }
  });
}

async function sendEmail(transporter, { from, to, subject, html }) {
  return transporter.sendMail({ from, to, subject, html });
}

module.exports = { createTransport, sendEmail };
