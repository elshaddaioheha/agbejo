import { NextResponse } from 'next/server';
import { uploadEvidence } from '@/lib/ipfs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Upload to IPFS/Arweave
    const result = await uploadEvidence({
      file,
      fileName: file.name,
      fileType: file.type,
    });

    return NextResponse.json({
      hash: result.hash,
      url: result.url,
      service: result.service,
      size: file.size,
      name: file.name,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

