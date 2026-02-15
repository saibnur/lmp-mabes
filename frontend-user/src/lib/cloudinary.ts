export const uploadToCloudinary = async (
    file: File,
    folder: string,
    signData?: {
        signature: string;
        timestamp: number;
        api_key: string;
        upload_preset: string;
        cloud_name: string;
        folder?: string;
    }
) => {
    const cloudName = signData?.cloud_name || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = signData?.upload_preset || 'lmp_preset';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // Always use the folder from signData if it's a signed request to ensure signature match
    const finalFolder = signData?.folder || (signData ? folder : `lmp_members/${folder}`);
    formData.append('folder', finalFolder);

    if (signData) {
        formData.append('signature', signData.signature);
        formData.append('timestamp', signData.timestamp.toString());
        formData.append('api_key', signData.api_key);
    }

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const errData = await response.json();
            console.error('Cloudinary Error Data:', errData);
            throw new Error('Gagal upload ke Cloudinary');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
};
