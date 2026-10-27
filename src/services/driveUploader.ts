export interface AppFileItem {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  category: 'config' | 'source' | 'style' | 'asset' | 'server';
}

export interface UploadProgress {
  total: number;
  completed: number;
  currentFile: string;
  status: 'idle' | 'preparing' | 'uploading' | 'completed' | 'error';
  folderId?: string;
  folderName?: string;
  folderUrl?: string;
  errorMessage?: string;
  fileStatuses: Record<string, 'pending' | 'uploading' | 'done' | 'failed'>;
}

export async function fetchAppProjectFiles(): Promise<AppFileItem[]> {
  const res = await fetch('/api/app-files');
  if (!res.ok) {
    throw new Error('Failed to load application files from server.');
  }
  const data = await res.json();
  return data.files || [];
}

export async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string
): Promise<{ id: string; name: string; folderUrl: string }> {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Export of vybe by sparsh application source files',
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to create folder on Google Drive (${res.status}).`);
  }

  const data = await res.json();
  const folderUrl = data.webViewLink || `https://drive.google.com/drive/folders/${data.id}`;
  return { id: data.id, name: data.name, folderUrl };
}

export async function uploadSingleFileToDrive(
  accessToken: string,
  folderId: string,
  fileItem: AppFileItem,
  content: string
): Promise<{ id: string; name: string }> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileItem.path.replace(/\//g, '__'), // Keep full path structure visible in name (e.g. src__App.tsx)
    parents: [folderId],
    description: `Original path: ${fileItem.path}`,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${fileItem.mimeType || 'text/plain'}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to upload ${fileItem.path} (${res.status}).`);
  }

  return await res.json();
}
