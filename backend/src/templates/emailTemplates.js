// backend/src/templates/emailTemplates.js

/**
 * Base email wrapper with MsikaAI branding
 */
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MsikaAI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      text-align: center;
      background: linear-gradient(135deg, #A51130 0%, #7a0d24 100%);
      padding: 30px 20px;
      border-radius: 12px 12px 0 0;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      color: #fbbf24;
      margin: 5px 0 0 0;
      font-size: 14px;
    }
    .content {
      padding: 30px 25px;
      background: #ffffff;
      border-radius: 0 0 12px 12px;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .content h2 {
      color: #0f172a;
      margin-top: 0;
      font-size: 22px;
    }
    .content p {
      color: #475569;
      line-height: 1.7;
      margin: 12px 0;
    }
    .button {
      display: inline-block;
      background: #A51130;
      color: #ffffff !important;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 16px 0;
    }
    .button:hover {
      background: #7a0d24;
    }
    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      padding: 20px 25px;
      background: #f8fafc;
      border-radius: 0 0 12px 12px;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .footer p {
      color: #94a3b8;
      font-size: 12px;
      margin: 4px 0;
    }
    .footer a {
      color: #A51130;
      text-decoration: none;
    }
    .badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .highlight {
      background: #f1f5f9;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
    }
    .highlight strong {
      color: #0f172a;
    }
    ul {
      color: #475569;
      line-height: 1.8;
      padding-left: 20px;
    }
    li {
      margin: 6px 0;
    }
    @media (max-width: 480px) {
      .container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .header h1 {
        font-size: 22px;
      }
    }
  </style>
</head>
<body>
  <div style="max-width: 600px; margin: 20px auto; padding: 0 10px;">
    <div class="container">
      <div class="header">
        <h1>🛒 MsikaAI</h1>
        <p>⚡ Malawi's Smart Marketplace</p>
      </div>
      ${content}
    </div>
  </div>
</body>
</html>
`;

/**
 * Welcome email template
 */
export const welcomeEmailTemplate = ({ name, email, verificationLink, dashboardLink }) => {
  const content = `
    <div class="content">
      <h2>👋 Welcome, ${name}!</h2>
      <p>
        You've successfully joined <strong>MsikaAI</strong> — Malawi's premier AI-powered marketplace!
        Your account has been created with the email: <strong>${email}</strong>
      </p>
      
      <div class="highlight">
        <p><strong>✨ What you can do with MsikaAI:</strong></p>
        <ul>
          <li>🛒 Buy and sell goods in Malawi</li>
          <li>🔧 Find local services like plumbers and electricians</li>
          <li>🌾 List farm produce and agricultural inputs</li>
          <li>🎤 Use voice listing (speak in Chichewa or English)</li>
          <li>🤖 Get AI-powered search and recommendations</li>
        </ul>
      </div>
      
      ${verificationLink ? `
        <div style="text-align: center;">
          <a href="${verificationLink}" class="button">Verify Your Email →</a>
        </div>
        <p style="font-size: 14px; text-align: center; color: #94a3b8;">
          This link will expire in 24 hours
        </p>
      ` : ''}
      
      <p style="text-align: center;">
        <a href="${dashboardLink || 'https://msikaai.com/dashboard'}" style="color: #A51130; font-weight: 600;">
          Go to Dashboard →
        </a>
      </p>
      
      <hr class="divider" />
      
      <p style="font-size: 14px; color: #94a3b8; text-align: center;">
        Need help? Email us at <a href="mailto:support@msikaai.com" style="color: #A51130;">support@msikaai.com</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
      <p>📍 Mitundu, Malawi</p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Password reset email template
 */
export const passwordResetEmailTemplate = ({ name, resetLink, expiresIn = '1 hour' }) => {
  const content = `
    <div class="content">
      <h2>🔐 Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>
        We received a request to reset your MsikaAI password. 
        Click the button below to create a new password:
      </p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password →</a>
      </div>
      
      <p style="font-size: 14px; color: #94a3b8; text-align: center;">
        This link will expire in ${expiresIn}
      </p>
      
      <hr class="divider" />
      
      <p style="font-size: 14px; color: #94a3b8;">
        If you didn't request this password reset, please ignore this email.
      </p>
      <p style="font-size: 14px; color: #94a3b8;">
        Need help? Contact us at <a href="mailto:support@msikaai.com" style="color: #A51130;">support@msikaai.com</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Email verification template
 */
export const emailVerificationTemplate = ({ name, verificationLink }) => {
  const content = `
    <div class="content">
      <h2>📧 Verify Your Email</h2>
      <p>Hello ${name},</p>
      <p>
        Welcome to MsikaAI! Please verify your email address to unlock all features
        and start buying and selling on Malawi's smartest marketplace.
      </p>
      
      <div style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email →</a>
      </div>
      
      <p style="font-size: 14px; color: #94a3b8; text-align: center;">
        This link will expire in 24 hours
      </p>
      
      <hr class="divider" />
      
      <p style="font-size: 14px; color: #94a3b8; text-align: center;">
        Already verified? <a href="https://msikaai.com/login" style="color: #A51130;">Login here</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Listing created template
 */
export const listingCreatedTemplate = ({ name, listingTitle, listingUrl }) => {
  const content = `
    <div class="content">
      <h2>🚀 Your Listing is Live!</h2>
      <p>Hello ${name},</p>
      <p>
        Congratulations! Your listing <strong>"${listingTitle}"</strong> is now live on MsikaAI.
        It's visible to thousands of buyers across Malawi.
      </p>
      
      <div style="text-align: center;">
        <a href="${listingUrl}" class="button">View Your Listing →</a>
      </div>
      
      <div class="highlight">
        <p><strong>💡 Pro Tips:</strong></p>
        <ul>
          <li>Share your listing on social media</li>
          <li>Respond quickly to buyer inquiries</li>
          <li>Keep your listing updated</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Listing sold template
 */
export const listingSoldTemplate = ({ name, listingTitle, buyerName, price }) => {
  const content = `
    <div class="content">
      <h2>🎉 Your Item Has Been Sold!</h2>
      <p>Hello ${name},</p>
      <p>
        Great news! Your listing <strong>"${listingTitle}"</strong> has been sold to 
        <strong>${buyerName || 'a buyer'}</strong> for <strong>MK${price || 'the agreed price'}</strong>!
      </p>
      
      <div class="highlight">
        <p><strong>📋 Next Steps:</strong></p>
        <ul>
          <li>Contact the buyer to arrange delivery/pickup</li>
          <li>Confirm the sale in your dashboard</li>
          <li>Ask the buyer to leave a review</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="https://msikaai.com/dashboard" style="color: #A51130; font-weight: 600;">
          Go to Dashboard →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Business approved template
 */
export const businessApprovedTemplate = ({ name, businessName, dashboardLink }) => {
  const content = `
    <div class="content">
      <h2>✅ Your Business Has Been Approved!</h2>
      <p>Hello ${name},</p>
      <p>
        Congratulations! Your business <strong>"${businessName}"</strong> has been approved
        on MsikaAI. You can now start listing products and services.
      </p>
      
      <div style="text-align: center;">
        <a href="${dashboardLink || 'https://msikaai.com/dashboard'}" class="button">
          Start Listing →
        </a>
      </div>
      
      <div class="highlight">
        <p><strong>🚀 What's Next:</strong></p>
        <ul>
          <li>Create your first listing</li>
          <li>Add photos and descriptions</li>
          <li>Set competitive prices</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * Order confirmation template
 */
export const orderConfirmationTemplate = ({ name, orderId, items, total, deliveryAddress }) => {
  const itemsHtml = items ? items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">MK${item.price}</td>
    </tr>
  `).join('') : '';

  const content = `
    <div class="content">
      <h2>🛒 Order Confirmation</h2>
      <p>Hello ${name},</p>
      <p>
        Thank you for your order! Your order <strong>#${orderId}</strong> has been confirmed.
      </p>
      
      <div class="highlight">
        <p><strong>📦 Order Details:</strong></p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0;">
              <th style="text-align: left; padding: 8px 0;">Item</th>
              <th style="text-align: center; padding: 8px 0;">Qty</th>
              <th style="text-align: right; padding: 8px 0;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px 0; text-align: right; font-weight: 600;">Total:</td>
              <td style="padding: 12px 0; text-align: right; font-weight: 600;">MK${total}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      ${deliveryAddress ? `
        <p><strong>📍 Delivery Address:</strong></p>
        <p style="color: #475569;">${deliveryAddress}</p>
      ` : ''}
      
      <p style="text-align: center; font-size: 14px; color: #94a3b8;">
        You'll receive updates when your order is shipped.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
    </div>
  `;
  return baseTemplate(content);
};

/**
 * General notification email template
 */
export const notificationEmailTemplate = ({ name, subject, message, actionText, actionUrl }) => {
  const content = `
    <div class="content">
      <h2>${subject || 'MsikaAI Notification'}</h2>
      <p>Hello ${name},</p>
      <p>${message}</p>
      
      ${actionText && actionUrl ? `
        <div style="text-align: center;">
          <a href="${actionUrl}" class="button">${actionText} →</a>
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} MsikaAI. All rights reserved.</p>
    </div>
  `;
  return baseTemplate(content);
};