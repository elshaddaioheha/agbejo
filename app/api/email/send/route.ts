import { NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { to, subject, html, text, template, templateData } = await request.json();

    if (!to) {
      return NextResponse.json({ error: 'Missing required field: to' }, { status: 400 });
    }

    let emailOptions: { to: string; subject: string; html: string; text?: string };

    // Use template if provided
    if (template && templateData) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      switch (template) {
        case 'deal_invitation':
          if (!templateData.dealId || !templateData.role || !templateData.dealLink) {
            return NextResponse.json({ error: 'Missing template data for deal_invitation' }, { status: 400 });
          }
          emailOptions = emailTemplates.dealInvitation(
            templateData.dealId,
            templateData.role,
            templateData.dealLink || `${appUrl}/deal/${templateData.dealId}`
          );
          break;
        
        case 'deal_funded':
          if (!templateData.dealId || !templateData.amount) {
            return NextResponse.json({ error: 'Missing template data for deal_funded' }, { status: 400 });
          }
          emailOptions = emailTemplates.dealFunded(
            templateData.dealId,
            templateData.amount,
            templateData.dealLink || `${appUrl}/deal/${templateData.dealId}`
          );
          break;
        
        case 'dispute_raised':
          if (!templateData.dealId) {
            return NextResponse.json({ error: 'Missing template data for dispute_raised' }, { status: 400 });
          }
          emailOptions = emailTemplates.disputeRaised(
            templateData.dealId,
            templateData.dealLink || `${appUrl}/deal/${templateData.dealId}`
          );
          break;
        
        case 'deal_resolved':
          if (!templateData.dealId || !templateData.outcome) {
            return NextResponse.json({ error: 'Missing template data for deal_resolved' }, { status: 400 });
          }
          emailOptions = emailTemplates.dealResolved(
            templateData.dealId,
            templateData.outcome,
            templateData.dealLink || `${appUrl}/deal/${templateData.dealId}`
          );
          break;
        
        default:
          return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 });
      }
      
      emailOptions.to = to;
    } else {
      // Use custom email
      if (!subject || !html) {
        return NextResponse.json({ error: 'Missing required fields: subject and html (or use template)' }, { status: 400 });
      }
      emailOptions = { to, subject, html, text };
    }

    const result = await sendEmail(emailOptions);

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error || 'Failed to send email' 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

