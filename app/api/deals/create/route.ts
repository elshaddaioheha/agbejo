import { NextResponse } from 'next/server';
import { contractUtils } from '@/lib/contract';
import { upsertDeal, initDatabase } from '@/lib/db';
import { sendNotifications } from '@/lib/notifications';
import { trackDealId } from '@/lib/contract-deals';

export async function POST(request: Request) {
  try {
    const { seller, arbiter, arbiters, requiredVotes, amount, buyer, description, arbiterFeeType, arbiterFeeAmount, assetType, assetId, assetSerialNumber, sellerEmail, arbiterEmail, arbiterEmails } = await request.json();
    
    // Validate: must have either single arbiter or multi-sig arbiters
    const isMultiSig = arbiters && Array.isArray(arbiters) && arbiters.length > 0 && requiredVotes > 0;
    const isSingleArbiter = arbiter && arbiter.length > 0;
    
    if (!seller || !amount) {
      return NextResponse.json({ error: 'Missing required fields: seller and amount are required.' }, { status: 400 });
    }
    
    if (!isMultiSig && !isSingleArbiter) {
      return NextResponse.json({ error: 'Must specify either a single arbiter or multiple arbiters with required votes.' }, { status: 400 });
    }
    
    if (isMultiSig) {
      if (requiredVotes > arbiters.length) {
        return NextResponse.json({ error: 'Required votes cannot exceed number of arbiters.' }, { status: 400 });
      }
      if (requiredVotes < 1) {
        return NextResponse.json({ error: 'Required votes must be at least 1.' }, { status: 400 });
      }
    }
    
    // Validate arbiter fee if provided
    if (arbiterFeeType && arbiterFeeAmount) {
      if (arbiterFeeType === 'percentage' && (arbiterFeeAmount < 0 || arbiterFeeAmount > 100)) {
        return NextResponse.json({ error: 'Arbiter fee percentage must be between 0 and 100.' }, { status: 400 });
      }
      if (arbiterFeeType === 'flat' && arbiterFeeAmount < 0) {
        return NextResponse.json({ error: 'Arbiter fee must be positive.' }, { status: 400 });
      }
    }
    
    // Generate deal ID if not provided
    const dealId = `deal-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Create deal on smart contract
    // Note: The contract automatically sets buyer from msg.sender (transaction signer)
    // So the buyer parameter is for reference only - actual buyer is from the transaction
    const contractStatus = await contractUtils.createDeal({
      dealId,
      seller,
      arbiter: isSingleArbiter ? arbiter : undefined,
      arbiters: isMultiSig ? arbiters : undefined,
      requiredVotes: isMultiSig ? Number(requiredVotes) : 0,
      amount: Number(amount),
      description: description || '',
      arbiterFeeType: (arbiterFeeType as 'none' | 'percentage' | 'flat') || 'none',
      arbiterFeeAmount: arbiterFeeAmount ? Number(arbiterFeeAmount) : 0,
      assetType: (assetType as 'HBAR' | 'FUNGIBLE_TOKEN' | 'NFT') || 'HBAR',
      assetId: assetId || '',
      assetSerialNumber: assetSerialNumber ? Number(assetSerialNumber) : 0
    });
    
    // Check if contract transaction was successful
    if (contractStatus !== 'SUCCESS') {
      return NextResponse.json({ 
        error: `Contract transaction failed with status: ${contractStatus}` 
      }, { status: 500 });
    }

    // Track the new deal ID
    trackDealId(dealId);

    // Sync to database immediately (if configured)
    try {
      if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        // Database not configured - skip sync
        return NextResponse.json({ message: 'Deal proposed successfully!', dealId });
      }
      
      await initDatabase();
      await upsertDeal({
        dealId,
        buyer,
        seller,
        arbiter,
        amount: Number(amount),
        status: 'PROPOSED',
        createdAt: new Date().toISOString(),
        sellerAccepted: false,
        arbiterAccepted: false,
        description: description || '',
        arbiterFeeType: arbiterFeeType || null,
        arbiterFeeAmount: arbiterFeeAmount ? Number(arbiterFeeAmount) : 0,
        assetType: assetType || 'HBAR',
        assetId: assetId || undefined,
        assetSerialNumber: assetSerialNumber ? Number(assetSerialNumber) : undefined,
      });
    } catch (dbError) {
      // Silently ignore database sync errors - not critical
      console.debug('Database sync skipped or failed (non-critical):', dbError instanceof Error ? dbError.message : 'Unknown error');
      // Continue even if database sync fails
    }

    // Send notifications (non-blocking)
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const dealLink = `${appUrl}/deal/${dealId}`;
      
      const recipients: Array<{ email?: string; accountId: string; role: 'buyer' | 'seller' | 'arbiter' }> = [
        { accountId: seller, email: sellerEmail, role: 'seller' },
      ];

      if (isMultiSig && arbiters) {
        const emails = arbiterEmails || [];
        arbiters.forEach((arb, idx) => {
          recipients.push({
            accountId: arb,
            email: emails[idx],
            role: 'arbiter',
          });
        });
      } else if (isSingleArbiter && arbiter) {
        recipients.push({
          accountId: arbiter,
          email: arbiterEmail,
          role: 'arbiter',
        });
      }

      // Send notifications asynchronously (don't wait)
      sendNotifications({
        type: 'deal_created',
        dealId,
        recipients,
        dealData: {
          amount: Number(amount),
          description,
        },
      }).catch(err => console.error('Notification error (non-critical):', err));
    } catch (notifError) {
      // Don't fail deal creation if notifications fail
      console.error('Failed to send notifications (non-critical):', notifError);
    }

    return NextResponse.json({ message: 'Deal proposed successfully!', dealId, dealLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deal/${dealId}` });
  } catch (error) {
    console.error('Error creating deal:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}