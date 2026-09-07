// backend/src/services/emailService.js
import { Resend } from 'resend';
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

class EmailService {
  constructor() {
    this.resend = null;
    this.isConfigured = false;
    this.fromEmail = process.env.RESEND_FROM_EMAIL || 'no-reply@msikaai.com';
    this.fromName = process.env.RESEND_FROM_NAME || 'MsikaAI Marketplace';
    this.isEnabled = process.env.EMAIL_ENABLED !== 'false';

    if (process.env.RESEND_API_KEY) {
      try {
        this.resend = new Resend(process.env.RESEND_API_KEY);
        this.isConfigured = true;
        logger.info('✅ Resend email service configured');
      } catch (error) {
        logger.error('❌ Failed to initialize Resend:', error.message);
        this.isConfigured = false;
      }
    } else {
      logger.warn('⚠️ RESEND_API_KEY not configured, email service disabled');
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
    const text = `Welcome to MsikaAI, ${name}! Please verify your email to get started.`;

    return this.sendEmail({
      to,
      subject: `Welcome to MsikaAI! 🎉`,
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
      subject: `Reset Your MsikaAI Password`,
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
      subject: `Verify Your MsikaAI Email Address`,
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
      subject: `Order #${orderId} Confirmation - MsikaAI 🛒`,
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
      subject: subject || 'MsikaAI Notification',
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