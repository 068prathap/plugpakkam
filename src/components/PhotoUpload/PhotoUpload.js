'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signUpload } from '@/app/actions/upload';
import { MAX_PHOTOS } from '@/lib/constants';
import styles from './PhotoUpload.module.css';

async function uploadPhoto(file) {
  const sign = await signUpload();
  if (!sign) return { off: true };

  const body = new FormData();
  body.append('file', file);
  body.append('api_key', sign.apiKey);
  body.append('timestamp', sign.timestamp);
  body.append('signature', sign.signature);
  body.append('folder', sign.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
    method: 'POST',
    body,
  });
  const data = await response.json();
  return { url: data.secure_url };
}

function PhotoUpload({ photos, onChange, t }) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleFiles(event) {
    const files = [...event.target.files].slice(0, MAX_PHOTOS - photos.length);
    event.target.value = '';
    if (files.length === 0) return;

    setUploading(true);
    setMessage('');
    const urls = [];

    for (const file of files) {
      try {
        const result = await uploadPhoto(file);
        if (result.off) {
          setMessage(t.form.uploadOff);
          break;
        }
        if (result.url) urls.push(result.url);
        else setMessage(t.form.uploadFailed);
      } catch {
        setMessage(t.form.uploadFailed);
      }
    }

    onChange([...photos, ...urls]);
    setUploading(false);
  }

  return (
    <div className={styles.photos}>
      {photos.map((url) => (
        <div key={url} className={styles.photo}>
          <Image src={url} alt="" fill sizes="120px" />
          <input type="hidden" name="photos" value={url} />
          <button type="button" onClick={() => onChange(photos.filter((photo) => photo !== url))}>
            {t.form.removePhoto}
          </button>
        </div>
      ))}

      {photos.length < MAX_PHOTOS && (
        <label className={styles.add}>
          <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={uploading} />
          <span>{uploading ? t.form.uploading : `+ ${t.form.addPhotos}`}</span>
        </label>
      )}

      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}

export default PhotoUpload;
