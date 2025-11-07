/**
 * Email Service Integration
 * Supports Resend, SendGrid, and AWS SES
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via Resend
 * Requires RESEND_API_KEY in environment
 */
export async function sendEmailResend(options: EmailOptions): Promise<EmailResult> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@agbejo.com';

  if (!RESEND_API_KEY) {
    throw new Error('Resend API key not configured. Set RESEND_API_KEY in environment variables.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email via Resend');
  }

  const data = await response.json();
  return {
    success: true,
    messageId: data.id,
  };
}

/**
 * Send email via SendGrid
 * Requires SENDGRID_API_KEY in environment
 */
export async function sendEmailSendGrid(options: EmailOptions): Promise<EmailResult> {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@agbejo.com';

  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured. Set SENDGRID_API_KEY in environment variables.');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: options.to }],
      }],
      from: { email: FROM_EMAIL },
      subject: options.subject,
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
        {
          type: 'text/plain',
          value: options.text || options.html.replace(/<[^>]*>/g, ''),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to send email via SendGrid');
  }

  return {
    success: true,
    messageId: response.headers.get('x-message-id') || undefined,
  };
}

/**
 * Main email sending function - tries different services
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // Try Resend first (easiest to set up)
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendEmailResend(options);
    } catch (error) {
      console.warn('Resend email failed, trying SendGrid:', error);
    }
  }

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    try {
      return await sendEmailSendGrid(options);
    } catch (error) {
      console.warn('SendGrid email failed:', error);
    }
  }

  // Fallback: log email (for development)
  console.log('Email (not sent - no service configured):', {
    to: options.to,
    subject: options.subject,
  });

  return {
    success: false,
    error: 'No email service configured. Set RESEND_API_KEY or SENDGRID_API_KEY in environment variables.',
  };
}

/**
 * Email templates
 */
export const emailTemplates = {
  dealInvitation: (dealId: string, role: 'seller' | 'arbiter', dealLink: string) => ({
    subject: `You've been invited to participate in a deal on Agbejo`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Deal Invitation</h2>
        <p>You've been invited to participate in a deal as a <strong>${role}</strong>.</p>
        <p>Deal ID: <code>${dealId}</code></p>
        <a href="${dealLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Deal
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          If you don't have a Hedera wallet, you can create one when you click the link above.
        </p>
      </div>
    `,
  }),

  dealFunded: (dealId: string, amount: number, dealLink: string) => ({
    subject: `Deal ${dealId} has been funded`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Deal Funded</h2>
        <p>The deal has been funded with <strong>${amount} HBAR</strong>.</p>
        <p>Deal ID: <code>${dealId}</code></p>
        <a href="${dealLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Deal
        </a>
      </div>
    `,
  }),

  disputeRaised: (dealId: string, dealLink: string) => ({
    subject: `Dispute raised for deal ${dealId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Dispute Raised</h2>
        <p>A dispute has been raised for this deal. As an arbiter, your attention is required.</p>
        <p>Deal ID: <code>${dealId}</code></p>
        <a href="${dealLink}" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Review Dispute
        </a>
      </div>
    `,
  }),

  dealResolved: (dealId: string, outcome: 'seller_paid' | 'buyer_refunded', dealLink: string) => ({
    subject: `Deal ${dealId} has been resolved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Deal Resolved</h2>
        <p>The dispute has been resolved. Outcome: <strong>${outcome === 'seller_paid' ? 'Seller Paid' : 'Buyer Refunded'}</strong></p>
        <p>Deal ID: <code>${dealId}</code></p>
        <a href="${dealLink}" style="display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Deal
        </a>
      </div>
    `,
  }),
};

