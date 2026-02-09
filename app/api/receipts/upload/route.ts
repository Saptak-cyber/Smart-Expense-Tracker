import { requireAuth } from '@/lib/auth-utils';
import { getEnv } from '@/lib/env';
import { checkRateLimit } from '@/lib/rate-limit';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export const dynamic = 'force-dynamic';

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Use service role for storage operations (bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Extract text from image using Tesseract.js
async function extractTextFromImage(imageBuffer: ArrayBuffer): Promise<string> {
  const worker = await createWorker('eng');

  try {
    const {
      data: { text },
    } = await worker.recognize(Buffer.from(imageBuffer));
    return text;
  } finally {
    await worker.terminate();
  }
}

// Parse OCR text to extract expense data
function parseReceiptText(text: string): {
  amount: number | null;
  date: string | null;
  merchant: string | null;
} {
  const lines = text.split('\n').filter((line) => line.trim());

  // Extract amount (look for currency symbols and numbers)
  let amount: number | null = null;
  const amountRegex =
    /(?:₹|Rs\.?|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)|(\d+(?:,\d+)*(?:\.\d{2})?)\s*(?:₹|Rs\.?|INR)/i;
  for (const line of lines) {
    const match = line.match(amountRegex);
    if (match) {
      const amountStr = (match[1] || match[2]).replace(/,/g, '');
      amount = parseFloat(amountStr);
      break;
    }
  }

  // Extract date
  let date: string | null = null;
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  for (const line of lines) {
    const match = line.match(dateRegex);
    if (match) {
      const [, day, month, year] = match;
      const fullYear = year.length === 2 ? `20${year}` : year;
      date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      break;
    }
  }

  // Extract merchant (usually the first few lines)
  const merchant = lines.slice(0, 2).join(' ').substring(0, 100) || null;

  return { amount, date, merchant };
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const rateLimitResponse = await checkRateLimit(request, 'mutation');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and PDF are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB' }, { status: 400 });
    }

    const userId = auth.user!.id;
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from('receipts').getPublicUrl(fileName);

    // Perform OCR if it's an image
    let ocrData = null;
    if (file.type.startsWith('image/')) {
      try {
        const text = await extractTextFromImage(arrayBuffer);
        ocrData = parseReceiptText(text);
      } catch (error) {
        console.error('OCR error:', error);
        // OCR is optional, so we continue even if it fails
      }
    }

    return NextResponse.json({
      url: publicUrl,
      ocr: ocrData,
      fileName: uploadData.path,
    });
  } catch (error: any) {
    console.error('Receipt upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload receipt' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a receipt
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.response;

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');

  if (!fileName) {
    return NextResponse.json({ error: 'File name is required' }, { status: 400 });
  }

  const userId = auth.user!.id;

  // Verify the file belongs to the user
  if (!fileName.startsWith(`${userId}/`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { error } = await supabaseAdmin.storage.from('receipts').remove([fileName]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Receipt deleted successfully' });
}
