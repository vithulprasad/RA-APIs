// sendEmail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "vidhueco123@gmail.com",
    pass: "xwhla hgjuklclcxb", // App password
  },
});

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: "vidhueco123@gmail.com",
    to,
    subject,
    html, // ✅ HTML content instead of text
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
