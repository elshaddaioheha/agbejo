import { NextResponse } from 'next/server';
import { contractUtils } from '@/lib/contract';

export async function POST(request: Request) {
  try {
    const { dealId, amount, buyerAccountId } = await request.json();
    if (!dealId || !amount || !buyerAccountId) {
      return NextResponse.json({ 
        error: 'Missing required fields: dealId, amount, and buyerAccountId are required.' 
      }, { status: 400 });
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 });
    }

    // Fund the deal on smart contract
    // Note: The amount should be in tinybars (1 HBAR = 100,000,000 tinybars)
    // For HBAR, the amount is automatically transferred with the transaction
    const contractStatus = await contractUtils.fundDealHBAR(
      dealId, 
      amountNum, 
      buyerAccountId
    );

    if (contractStatus !== 'SUCCESS') {
      return NextResponse.json({ 
        error: `Contract transaction failed with status: ${contractStatus}` 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deal funded successfully!' });
  } catch (error) {
    console.error('Error funding deal:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

