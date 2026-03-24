import axios from 'axios';

export const uploadFile = async (file: any) => {
  const formData = new FormData();

  formData.append(
    'file',
    {
      uri: file.uri,
      name: file.name || 'upload.jpg',
      type: file.mimeType || 'image/jpeg',
    } as any
  );

  const res = await fetch(
    'https://drivemate.api.luisant.cloud/api/upload/file',
    {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return await res.json();
};