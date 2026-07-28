// backend/src/services/email.js
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@msikaai.com',
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log email in database
      await supabase
        .from('email_logs')
        .insert({
          to,
          subject,
          status: 'sent',
          message_id: info.messageId
        });

      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log failed email
      await supabase
        .from('email_logs')
        .insert({
          to,
          subject,
          status: 'failed',
          error: error.message
        });

      throw error;
    }
  }

  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to MsikaAI! 🎉</h1>
            </div>
            <div class="content">
              <h2>Hi ${user.full_name || 'there'}!</h2>
              <p>Thank you for joining MsikaAI. We're excited to have you on board!</p>
              <p>With MsikaAI, you can:</p>
              <ul>
                <li>🚀 Create and manage projects</li>
                <li>💰 Accept payments securely</li>
                <li>📊 Track your analytics</li>
                <li>🤖 Use AI-powered features</li>
              </ul>
              <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>
              </p>
            </div>
            <div class="footer">
              <p>Need help? <a href="${process.env.FRONTEND_URL}/support">Contact Support</a></p>
              <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to MsikaAI! 🎉',
      html,
      text: `Welcome to MsikaAI! Thank you for joining. Visit ${process.env.FRONTEND_URL}/dashboard to get started.`
    });
  }

  async sendPasswordResetEmail(user, resetLink) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <p>Hello ${user.full_name || 'there'},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <p style="text-align: center; margin-top: 30px;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: 'Reset Your Password',
      html,
      text: `Reset your password here: ${resetLink}`
    });
  }

  async sendOrderConfirmationEmail(user, order) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8fafc; }
            .order-details { background: white; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <h2>Thank you for your order! 🎉</h2>
              <p>Hello ${user.full_name || 'there'},</p>
              <p>Your order has been confirmed. Here are the details:</p>
              
              <div class="order-details">
                <p><strong>Order ID:</strong> #${order.id.slice(0, 8)}</p>
                <p><strong>Amount:</strong> $${order.amount.toFixed(2)}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              </div>

              ${order.project_id ? `<p>You can view your project in the <a href="${process.env.FRONTEND_URL}/projects">Projects</a> section.</p>` : ''}
            </div>
            <div class="footer">
              <p>Need help? <a href="${process.env.FRONTEND_URL}/support">Contact Support</a></p>
              <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject: `Order Confirmation #${order.id.slice(0, 8)}`,
      html,
      text: `Thank you for your order #${order.id.slice(0, 8)}. Amount: $${order.amount.toFixed(2)}`
    });
  }
}

export default new EmailService();