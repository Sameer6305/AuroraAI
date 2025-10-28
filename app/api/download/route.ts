import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing imageId parameter' },
        { status: 400 }
      );
    }

    // Get user record from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch image record to verify ownership and get the storage path
    const { data: image, error: imageError } = await supabase
      .from('generated_images')
      .select('id, image_url, user_id')
      .eq('id', imageId)
      .eq('user_id', user.id)
      .single();

    if (imageError || !image) {
      return NextResponse.json(
        { error: 'Image not found or access denied' },
        { status: 404 }
      );
    }

    // Extract the storage path from the image URL
    // Assuming image_url is in format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    // Or stored as just the path if using Supabase storage
    let storagePath: string;
    
    if (image.image_url.includes('supabase.co/storage')) {
      // Extract path from full URL
      const url = new URL(image.image_url);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === 'object') + 2; // Skip 'object' and 'public'
      storagePath = pathParts.slice(bucketIndex + 1).join('/');
    } else {
      // Assume it's already a path
      storagePath = image.image_url;
    }

    // Generate signed URL (valid for 5 minutes = 300 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('generated-images') // Replace with your actual bucket name
      .createSignedUrl(storagePath, 300);

    if (signedUrlError || !signedUrlData) {
      console.error('Failed to generate signed URL:', signedUrlError);
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      );
    }

    // Return JSON with download URL
    return NextResponse.json({
      downloadUrl: signedUrlData.signedUrl,
      expiresIn: 300, // seconds
      imageId: image.id,
    });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
