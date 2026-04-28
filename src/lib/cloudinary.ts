import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function uploadVenueImage(
  file: Buffer,
  venueId: string,
  index: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `venuecharm/venues/${venueId}`,
        public_id: `photo-${index}`,
        resource_type: 'image',
        transformation: [
          {
            width: 1200,
            height: 800,
            crop: 'fill',
            quality: 'auto:good',
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`))
        } else {
          resolve(result!.secure_url)
        }
      },
    )

    uploadStream.end(file)
  })
}

export function getImageUrl(publicId: string, options?: { width?: number; height?: number }) {
  return cloudinary.url(publicId, {
    width: options?.width || 800,
    height: options?.height || 600,
    crop: 'fill',
    quality: 'auto:good',
    secure: true,
  })
}
