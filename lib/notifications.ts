/**
 * Notification Service
 * Handles email and push notifications for deal events
 */

import { sendEmail, emailTemplates } from './email';

export interface NotificationOptions {
  type: 'deal_created' | 'deal_funded' | 'dispute_raised' | 'deal_resolved' | 'deal_accepted';
  dealId: string;
  recipients: {
    email?: string;
    accountId: string;
    role: 'buyer' | 'seller' | 'arbiter';
  }[];
  dealData?: {
    amount?: number;
    description?: string;
    outcome?: 'seller_paid' | 'buyer_refunded';
  };
}

/**
 * Send notifications for a deal event
 */
export async function sendNotifications(options: NotificationOptions): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dealLink = `${appUrl}/deal/${options.dealId}`;

  // Send emails to all recipients
  const emailPromises = options.recipients
    .filter(r => r.email)
    .map(async (recipient) => {
      try {
        let template: string;
        let templateData: any;

        switch (options.type) {
          case 'deal_created':
            template = 'deal_invitation';
            templateData = {
              dealId: options.dealId,
              role: recipient.role === 'seller' ? 'seller' : 'arbiter',
              dealLink,
            };
            break;

          case 'deal_funded':
            template = 'deal_funded';
            templateData = {
              dealId: options.dealId,
              amount: options.dealData?.amount || 0,
              dealLink,
            };
            break;

          case 'dispute_raised':
            if (recipient.role === 'arbiter') {
              template = 'dispute_raised';
              templateData = {
                dealId: options.dealId,
                dealLink,
              };
            } else {
              // Buyer/seller get different notification
              return; // Skip for now, can add custom template
            }
            break;

          case 'deal_resolved':
            template = 'deal_resolved';
            templateData = {
              dealId: options.dealId,
              outcome: options.dealData?.outcome || 'seller_paid',
              dealLink,
            };
            break;

          default:
            return; // Unknown notification type
        }

        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient.email,
            template,
            templateData,
          }),
        });
      } catch (error) {
        console.error(`Failed to send notification to ${recipient.email}:`, error);
        // Don't throw - continue with other recipients
      }
    });

  await Promise.allSettled(emailPromises);

  // TODO: Add Push Protocol integration for Web3 notifications
  // This would require Push Protocol SDK and user subscriptions
}

/**
 * Helper to get recipient emails from deal data
 * In production, you'd have a database mapping account IDs to emails
 */
export async function getRecipientEmails(accountIds: string[]): Promise<Map<string, string>> {
  // Placeholder - in production, query database for email addresses
  // For link-based deals, emails would be stored when deal is created
  const emailMap = new Map<string, string>();
  
  // TODO: Query database for email addresses
  // const emails = await db.query('SELECT account_id, email FROM user_emails WHERE account_id IN (...)');
  
  return emailMap;
}

