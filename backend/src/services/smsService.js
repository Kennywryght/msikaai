// backend/src/services/smsService.js
//
// Africa's Talking SMS. Configure with:
//   AT_USERNAME   your AT app username ("sandbox" for the sandbox)
//   AT_API_KEY    the app's API key
//   AT_SENDER_ID  optional approved sender ID / short code
//
// When AT_USERNAME/AT_API_KEY are unset, isConfigured is false and send()
// returns { success: false, stub: true } without contacting anything —
// callers decide whether to fall back (e.g. dev-only console OTP).
import axios from 'axios';
import { logger } from '../utils/logger.js';

const DEFAULT_COUNTRY_CODE = process.env.SMS_DEFAULT_COUNTRY_CODE || '265'; // Malawi

/**
 * Normalize to E.164. Accepts "0888 123 456", "888123456", "265888123456",
 * "+265 888-123-456". Returns null if it doesn't look like a phone number.
 */
export const normalizeMsisdn = (raw, cc = DEFAULT_COUNTRY_CODE) => {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;
  let d = String(raw).trim().replace(/[\s\-().]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = cc + d.slice(1);
  else if (d.length <= 9) d = cc + d;
  if (!/^\d{10,15}$/.test(d)) return null;
  return `+${d}`;
};

class SmsService {
  constructor() {
    this.username = process.env.AT_USERNAME;
    this.apiKey = process.env.AT_API_KEY;
    this.senderId = process.env.AT_SENDER_ID || undefined;
    this.isConfigured = !!(this.username && this.apiKey);
    this.endpoint =
      this.username === 'sandbox'
        ? 'https://api.sandbox.africastalking.com/version1/messaging'
        : 'https://api.africastalking.com/version1/messaging';

    if (this.isConfigured) logger.info(`✅ SMS configured (Africa's Talking${this.username === 'sandbox' ? ' sandbox' : ''})`);
    else logger.warn("⚠️ SMS not configured (AT_USERNAME / AT_API_KEY) — messages will not be sent");
  }

  /**
   * @returns {Promise<{success:boolean, stub?:boolean, to?:string, messageId?:string, error?:string}>}
   */
  async send(to, message) {
    const msisdn = normalizeMsisdn(to);
    if (!msisdn) return { success: false, error: 'Invalid phone number' };
    if (!this.isConfigured) return { success: false, stub: true, to: msisdn };

    try {
      const body = new URLSearchParams({ username: this.username, to: msisdn, message });
      if (this.senderId) body.set('from', this.senderId);

      const { data } = await axios.post(this.endpoint, body.toString(), {
        headers: {
          apiKey: this.apiKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      });

      const recipient = data?.SMSMessageData?.Recipients?.[0];
      // 100 Processed, 101 Sent, 102 Queued
      const ok = recipient && [100, 101, 102].includes(Number(recipient.statusCode));
      if (!ok) {
        const error = recipient?.status || data?.SMSMessageData?.Message || 'SMS rejected';
        logger.warn('SMS not accepted', { to: msisdn, error });
        return { success: false, to: msisdn, error };
      }
      return { success: true, to: msisdn, messageId: recipient.messageId };
    } catch (error) {
      const msg = error.response?.data || error.message;
      logger.error('SMS send failed', { to: msisdn, error: msg });
      return { success: false, to: msisdn, error: typeof msg === 'string' ? msg : 'SMS send failed' };
    }
  }
}

export default new SmsService();
