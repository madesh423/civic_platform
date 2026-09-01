import { supabase } from '@/lib/supabase';

export async function uploadReportImage(
  file: File,
  reportId: string,
  userId: string
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${reportId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('report-media')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('report-media').getPublicUrl(path);
  return data.publicUrl;
}

export async function createObjectUrl(file: File): Promise<string> {
  return URL.createObjectURL(file);
}

export function compressImage(file: File, maxDim = 1280, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression failed'));
          const out = new File([blob], file.name, { type: 'image/jpeg' });
          resolve(out);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Invalid image'));
    img.src = URL.createObjectURL(file);
  });
}
