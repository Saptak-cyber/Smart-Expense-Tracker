import { requireAuth } from '@/lib/auth-utils';
import { getEnv } from '@/lib/env';
import { extractReceiptData, matchCategory } from '@/lib/groq';
import { checkRateLimit } from '@/lib/rate-limit';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

    // Perform OCR using Groq Vision API if it's an image
    let ocrData = null;
    if (file.type.startsWith('image/')) {
      try {
        // Fetch all categories (categories are global, not user-specific)
        const { data: categories } = await supabaseAdmin
          .from('categories')
          .select('id, name')
          .order('name');

        console.log('Available categories:', JSON.stringify(categories, null, 2));

        // Convert image to base64
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        // Extract receipt data using Groq Llama Vision with user's categories
        const extractedData = await extractReceiptData(base64Image, categories || []);
        console.log('Extracted data from Groq:', JSON.stringify(extractedData, null, 2));

        // Match extracted category to user's categories (defaults to "Other" if no match)
        const categoryId = extractedData.category
          ? matchCategory(extractedData.category, categories || [])
          : null;

        console.log('Extracted category:', extractedData.category);
        console.log('Matched category ID:', categoryId);
        if (categoryId) {
          const matchedCat = categories?.find((c) => c.id === categoryId);
          console.log('Matched category name:', matchedCat?.name);
        }

        ocrData = {
          amount: extractedData.amount,
          date: extractedData.date,
          merchant: extractedData.description,
          category_id: categoryId,
          category_name: extractedData.category,
        };

        console.log('Final OCR data:', JSON.stringify(ocrData, null, 2));
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
