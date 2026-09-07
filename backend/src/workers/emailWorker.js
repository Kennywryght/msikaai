// backend/src/workers/emailWorker.js
import { logger } from '../utils/logger.js';
import queueService from '../services/queueService.js';
import emailService from '../services/emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

class EmailWorker {
  async processEmail(data) {
    const { to, subject, html, text, template, templateData } = data;

    try {
      logger.info(`📧 Processing email to ${to}: ${subject}`);

      let emailHtml = html;
      let emailText = text;

      // If template is specified, use template
      if (template && templateData) {
        // For now, we'll use the provided html
        // In the future, you could use a template engine like Handlebars
        emailHtml = html || this.getTemplate(template, templateData);
        emailText = text || this.getPlainTextTemplate(template, templateData);
      }

      // Send email
      const result = await emailService.sendEmail({
        to,
        subject,
        html: emailHtml,
        text: emailText,
      });

      if (result.success) {
        logger.info(`✅ Email sent to ${to}`);
        return { success: true, id: result.id };
      } else {
        throw new Error(result.error || 'Email send failed');
      }
    } catch (error) {
      logger.error(`❌ Email processing error for ${to}:`, error.message);
      throw error;
    }
  }

  getTemplate(template, data) {
    // Simple template examples - can be expanded
    const templates = {
      welcome: `
        <h1>Welcome ${data.name || 'there'}!</h1>
        <p>Thank you for joining Kumsika!</p>
      `,
      resetPassword: `
        <h1>Reset Your Password</h1>
        <p>Click <a href="${data.resetLink}">here</a> to reset your password.</p>
      `,
    };

    return templates[template] || templates.welcome;
  }

  getPlainTextTemplate(template, data) {
    const templates = {
      welcome: `Welcome ${data.name || 'there'}! Thank you for joining Kumsika!`,
      resetPassword: `Reset Your Password: ${data.resetLink}`,
    };

    return templates[template] || templates.welcome;
  }

  async start() {
    logger.info('🚀 Starting Email Worker...');

    try {
      await queueService.consume('email', async (data) => {
        await this.processEmail(data);
      });

      logger.info('✅ Email Worker started successfully');
    } catch (error) {
      logger.error('Failed to start Email Worker:', error.message);
      process.exit(1);
    }
  }
}

// Run the worker if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new EmailWorker();
  worker.start().catch((error) => {
    logger.error('Worker error:', error);
    process.exit(1);
  });
}

export default EmailWorker;