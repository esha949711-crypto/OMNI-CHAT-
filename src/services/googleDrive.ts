export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  starred?: boolean;
}

export interface ListFilesResponse {
  files: DriveFileItem[];
  nextPageToken?: string;
}

/**
 * List files from user's Google Drive
 */
export async function listDriveFiles(
  accessToken: string,
  searchQuery?: string,
  pageToken?: string
): Promise<ListFilesResponse> {
  const params = new URLSearchParams();
  params.set('pageSize', '30');
  params.set(
    'fields',
    'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink,starred)'
  );
  params.set('orderBy', 'modifiedTime desc');

  let q = 'trashed = false';
  if (searchQuery && searchQuery.trim().length > 0) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }
  params.set('q', q);

  if (pageToken) {
    params.set('pageToken', pageToken);
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Google Drive error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch file content for use as prompt context or analysis
 */
export async function fetchDriveFileContent(
  accessToken: string,
  file: DriveFileItem
): Promise<{ text: string; isBinary?: boolean; mimeType: string }> {
  // Google Docs -> Export as plain text
  if (file.mimeType === 'application/vnd.google-apps.document') {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) throw new Error('Could not export Google Doc text');
    const text = await res.text();
    return { text, mimeType: 'text/plain' };
  }

  // Google Sheets -> Export as CSV
  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/csv`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) throw new Error('Could not export Google Sheet CSV');
    const text = await res.text();
    return { text, mimeType: 'text/csv' };
  }

  // Google Slides -> Export as plain text
  if (file.mimeType === 'application/vnd.google-apps.presentation') {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) throw new Error('Could not export Google Presentation text');
    const text = await res.text();
    return { text, mimeType: 'text/plain' };
  }

  // Standard text/code/json/markdown files
  const isTextLike =
    file.mimeType.startsWith('text/') ||
    file.mimeType.includes('json') ||
    file.mimeType.includes('javascript') ||
    file.mimeType.includes('typescript') ||
    file.mimeType.includes('markdown') ||
    file.mimeType.includes('xml') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.ts') ||
    file.name.endsWith('.js') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.py') ||
    file.name.endsWith('.csv');

  if (isTextLike) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Could not read file: ${file.name}`);
    const text = await res.text();
    return { text, mimeType: file.mimeType || 'text/plain' };
  }

  // Images (read as base64 for multimodal vision support in chat)
  if (file.mimeType.startsWith('image/')) {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Could not read image: ${file.name}`);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          text: reader.result as string,
          isBinary: true,
          mimeType: file.mimeType,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Fallback for other files
  return {
    text: `[Google Drive File: ${file.name} (${file.mimeType})] Link: ${file.webViewLink || 'N/A'}`,
    mimeType: file.mimeType,
  };
}

/**
 * Save chat transcript or note directly to Google Drive as Markdown or Text file
 */
export async function saveFileToGoogleDrive(
  accessToken: string,
  options: {
    name: string;
    content: string;
    mimeType?: string;
    description?: string;
  }
): Promise<DriveFileItem> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const mimeType = options.mimeType || 'text/markdown';
  const metadata = {
    name: options.name,
    mimeType,
    description: options.description || 'Exported from OmniChat AI Assistant',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    options.content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create file in Google Drive: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a file in Google Drive (Destructive operation - requires user confirmation before calling)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file from Google Drive.`);
  }
}
