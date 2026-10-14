// backend/src/services/emailService.js
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import {
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  emailVerificationTemplate,
  listingCreatedTemplate,
  listingSoldTemplate,
  businessApprovedTemplate,
  orderConfirmationTemplate,
  notificationEmailTemplate,
} from '../templates/emailTemplates.js';

/**
 * Sends email through whichever FREE provider is configured:
 *   1. Any SMTP server (SMTP_HOST/SMTP_USER/SMTP_PASS) — e.g.
 *        Gmail:  smtp.gmail.com : 465, an App Password    (~500 emails/day)
 *        Brevo:  smtp-relay.brevo.com : 587, SMTP key     (300 emails/day)
 *   2. Resend (RESEND_API_KEY) — 100/day, needs a verified domain.
 * Supabase's built-in mailer is not used (it only sends ~2 emails/hour).
 */
class EmailService {
  constructor() {
    this.resend = null;
    this.smtp = null;
    this.provider = null;
    this.isConfigured = false;
    this.fromEmail = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.RESEND_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@msikaai.com';
    this.fromName = process.env.EMAIL_FROM_NAME || process.env.RESEND_FROM_NAME || 'Kumsika';
    this.isEnabled = process.env.EMAIL_ENABLED !== 'false';

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = Number.parseInt(process.env.SMTP_PORT || '465', 10);
      this.smtp = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        pool: true, // reuse the connection for bursts of emails
        maxConnections: 2,
      });
      this.provider = 'smtp';
      this.isConfigured = true;
      logger.info(`✅ Email via SMTP (${process.env.SMTP_HOST})`);
    } else if (process.env.RESEND_API_KEY) {
      try {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.provider = 'resend';
        this.isConfigured = true;
        logger.info('✅ Resend email service configured');
      } catch (error) {
        logger.error('❌ Failed to initialize Resend:', error.message);
        this.isConfigured = false;
      }
    } else {
      logger.warn('⚠️ No email provider configured (set SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY)');
    }
  }

  /**
   * Send an email
   */
  async sendEmail({ to, subject, html, text, from, replyTo, tags }) {
    // Check if email service is enabled
    if (!this.isEnabled) {
      logger.info(`📧 Email disabled - would send to ${to}: ${subject}`);
      return { success: true, message: 'Email disabled (simulated)' };
    }

    if (!this.isConfigured) {
      logger.warn(`📧 Email not configured - would send to ${to}: ${subject}`);
      return { success: false, error: 'Email service not configured' };
    }

    try {
      // Validate email
      if (!to || !subject || !html) {
        throw new Error('Missing required fields: to, subject, html');
      }

      if (this.provider === 'smtp') {
        const info = await this.smtp.sendMail({
          from: `"${this.fromName}" <${from || this.fromEmail}>`,
          to: Array.isArray(to) ? to.join(', ') : to,
          subject,
          html,
          text: text || this.convertHtmlToText(html),
          replyTo: replyTo || undefined,
        });
        logger.info(`✅ Email sent via SMTP: ${subject} (ID: ${info.messageId})`);
        return { success: true, id: info.messageId, to, subject };
      }

      const result = await this.resend.emails.send({
        from: from ? `${this.fromName} <${from}>` : `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: html,
        text: text || this.convertHtmlToText(html),
        reply_to: replyTo || this.fromEmail,
        tags: tags || [],
      });

      if (result.error) {
        logger.error('❌ Resend error:', result.error);
        return { success: false, error: result.error.message };
      }

      logger.info(`✅ Email sent to ${to}: ${subject} (ID: ${result.data?.id})`);
      return {
        success: true,
        id: result.data?.id,
        to: to,
        subject: subject,
      };
    } catch (error) {
      logger.error('❌ Email send error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(to, data = {}) {
    const { name = 'there', email = to, verificationLink, dashboardLink } = data;
    const html = welcomeEmailTemplate({ name, email, verificationLink, dashboardLink });
    const text = `Welcome to Kumsika, ${name}! Please verify your email to get started.`;

    return this.sendEmail({
      to,
      subject: `Welcome to Kumsika! 🎉`,
      html,
      text,
      tags: [{ name: 'category', value: 'welcome' }],
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to, data = {}) {
    const { name = 'User', resetLink, expiresIn = '1 hour' } = data;
    const html = passwordResetEmailTemplate({ name, resetLink, expiresIn });

    return this.sendEmail({
      to,
      subject: `Reset Your Kumsika Password`,
      html,
      tags: [{ name: 'category', value: 'password-reset' }],
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(to, data = {}) {
    const { name = 'User', verificationLink } = data;
    const html = emailVerificationTemplate({ name, verificationLink });

    return this.sendEmail({
      to,
      subject: `Verify Your Kumsika Email Address`,
      html,
      tags: [{ name: 'category', value: 'verification' }],
    });
  }

  /**
   * Send listing created notification
   */
  async sendListingCreatedEmail(to, data = {}) {
    const { name = 'User', listingTitle, listingUrl } = data;
    const html = listingCreatedTemplate({ name, listingTitle, listingUrl });

    return this.sendEmail({
      to,
      subject: `Your Listing "${listingTitle}" is Live! 🚀`,
      html,
      tags: [{ name: 'category', value: 'listing-created' }],
    });
  }

  /**
   * Send listing sold notification
   */
  async sendListingSoldEmail(to, data = {}) {
    const { name = 'User', listingTitle, buyerName, price } = data;
    const html = listingSoldTemplate({ name, listingTitle, buyerName, price });

    return this.sendEmail({
      to,
      subject: `Your Listing "${listingTitle}" Has Been Sold! 🎉`,
      html,
      tags: [{ name: 'category', value: 'listing-sold' }],
    });
  }

  /**
   * Send business approved notification
   */
  async sendBusinessApprovedEmail(to, data = {}) {
    const { name = 'User', businessName, dashboardLink } = data;
    const html = businessApprovedTemplate({ name, businessName, dashboardLink });

    return this.sendEmail({
      to,
      subject: `Your Business "${businessName}" Has Been Approved! ✅`,
      html,
      tags: [{ name: 'category', value: 'business-approved' }],
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(to, data = {}) {
    const { name = 'User', orderId, items, total, deliveryAddress } = data;
    const html = orderConfirmationTemplate({ name, orderId, items, total, deliveryAddress });

    return this.sendEmail({
      to,
      subject: `Order #${orderId} Confirmation - Kumsika 🛒`,
      html,
      tags: [{ name: 'category', value: 'order-confirmation' }],
    });
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(to, data = {}) {
    const { name = 'User', subject, message, actionText, actionUrl } = data;
    const html = notificationEmailTemplate({ name, subject, message, actionText, actionUrl });

    return this.sendEmail({
      to,
      subject: subject || 'Kumsika Notification',
      html,
      tags: [{ name: 'category', value: 'notification' }],
    });
  }

  /**
   * Convert HTML to plain text
   */
  convertHtmlToText(html) {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Get email service status
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      enabled: this.isEnabled,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
    };
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;