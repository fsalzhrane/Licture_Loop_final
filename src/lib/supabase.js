import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadFile(file, bucket, folder = '') {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload file to storage');
    }

    // Get the public URL
    const { data: urlData, error: urlError } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (urlError) {
      console.error('URL error:', urlError);
      throw new Error('Failed to get file URL');
    }

    return { filePath, publicUrl: urlData.publicUrl };
  } catch (error) {
    console.error('Error in uploadFile:', error.message);
    throw error;
  }
}

export function getFileType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const audioTypes = ['mp3', 'wav', 'ogg', 'm4a'];
  const pdfType = ['pdf'];
  const textType = ['txt'];
  
  if (imageTypes.includes(extension)) return 'image';
  if (audioTypes.includes(extension)) return 'audio';
  if (pdfType.includes(extension)) return 'pdf';
  if (textType.includes(extension)) return 'text';
  
  return 'other';
}