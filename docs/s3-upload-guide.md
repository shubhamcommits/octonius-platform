# S3 Upload System Guide

This guide explains how to use the new S3-based file upload system that uses presigned URLs for direct client-to-S3 uploads.

## Overview

The new S3 upload system provides:
- **Direct uploads to S3** - Files don't go through your server
- **Presigned URLs** - Secure, time-limited upload URLs  
- **Better performance** - Reduced server load and faster uploads
- **Scalability** - No server storage limitations

## Environment Configuration

Add these environment variables:

```bash
# S3 Configuration
S3_BUCKET_NAME=your-private-bucket-name
CDN_BASE_URL=https://media.octonius.com
AWS_DEFAULT_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## API Endpoints

### 1. Create Upload Intent
Creates a presigned URL for direct S3 upload.

**POST** `/files/upload-intent`

**Request Body:**
```json
{
  "file_name": "document.pdf",
  "file_type": "application/pdf", 
  "file_size": 1024000,
  "group_id": "optional-group-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "upload_url": "https://bucket.s3.amazonaws.com/...",
    "file_key": "workplaces/xxx/users/yyy/files/uuid.pdf",
    "bucket": "your-bucket-name",
    "expires_in": 900,
    "metadata": {
      "file_name": "document.pdf",
      "file_type": "application/pdf",
      "file_size": 1024000,
      "icon": "📄",
      "resolved_group_id": "group-uuid",
      "user_id": "user-uuid",
      "workplace_id": "workplace-uuid"
    }
  },
  "message": "Upload intent created successfully"
}
```

### 2. Upload File to S3
Use the `uploadUrl` from step 1 to upload directly to S3.

**PUT** `{upload_url}` (from response above)

**Headers:**
```
Content-Type: application/pdf (match the file_type from step 1)
```

**Body:** Raw file data

### 3. Complete Upload
After successful S3 upload, save the file metadata to your database.

**POST** `/files/complete-upload`

**Request Body:**
```json
{
  "file_key": "workplaces/xxx/users/yyy/files/uuid.pdf",
  "file_name": "document.pdf",
  "file_type": "application/pdf",
  "file_size": 1024000,
  "group_id": "group-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "name": "document.pdf",
    "type": "file",
    "icon": "📄",
    "size": 1024000,
    "mime_type": "application/pdf",
    "owner": "John Doe",
    "owner_avatar": "JD",
    "last_modified": "2024-01-15T10:30:00.000Z",
    "cdn_url": "https://media.octonius.com/workplaces/xxx/users/yyy/files/uuid.pdf"
  },
  "message": "File upload completed successfully"
}
```

### 4. Get Download URL
Get a presigned URL for secure file downloads.

**GET** `/files/{fileId}/download-url`

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "file",
    "download_url": "https://bucket.s3.amazonaws.com/...",
    "cdn_url": "https://media.octonius.com/workplaces/xxx/users/yyy/files/uuid.pdf",
    "file_name": "document.pdf",
    "file_type": "application/pdf", 
    "file_size": 1024000,
    "expires_in": 3600
  },
  "message": "Download URL generated"
}
```

## Frontend Implementation Example

```javascript
class S3FileUploader {
  async uploadFile(file, groupId = null) {
    try {
      // Step 1: Create upload intent
      const intentResponse = await fetch('/api/files/upload-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          group_id: groupId
        })
      });

      const intent = await intentResponse.json();
      if (!intent.success) throw new Error(intent.message);

      // Step 2: Upload directly to S3
      const uploadResponse = await fetch(intent.data.upload_url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('S3 upload failed');
      }

      // Step 3: Complete upload (save metadata)
      const completeResponse = await fetch('/api/files/complete-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          file_key: intent.data.file_key,
          file_name: intent.data.metadata.file_name,
          file_type: intent.data.metadata.file_type,
          file_size: intent.data.metadata.file_size,
          group_id: intent.data.metadata.resolved_group_id
        })
      });

      const result = await completeResponse.json();
      if (!result.success) throw new Error(result.message);

      return result.data; // File metadata
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async downloadFile(fileId) {
    try {
      // Get download URL
      const response = await fetch(`/api/files/${fileId}/download-url`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);

      if (result.data.type === 'note') {
        // Handle note content directly
        return result.data.content;
      } else {
        // For files, you have two options:
        // 1. Use secure presigned URL (expires after 1 hour)
        window.open(result.data.download_url, '_blank');
        
        // 2. Use CDN URL for public access (permanent, cached)
        // window.open(result.data.cdn_url, '_blank');
        
        return {
          secureUrl: result.data.download_url,
          publicUrl: result.data.cdn_url,
          fileName: result.data.file_name
        };
      }
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }
}

// Usage
const uploader = new S3FileUploader();

// Upload file
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      const uploadedFile = await uploader.uploadFile(file);
      console.log('File uploaded:', uploadedFile);
    } catch (error) {
      console.error('Upload error:', error);
    }
  }
});
```

## S3 Bucket & CDN Configuration

Your setup uses a private S3 bucket with CloudFront CDN distribution:

### S3 Bucket Configuration

#### CORS Policy
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### Bucket Policy (Private Bucket)
```json
{  
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPresignedUploads",
      "Effect": "Allow", 
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT:user/octonius-app"
      },
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-private-bucket/*"
    },
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR-ORIGIN-ACCESS-IDENTITY"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-private-bucket/*"
    }
  ]
}
```

### CloudFront Distribution

Your CloudFront distribution should be configured with:
- **Origin**: Your private S3 bucket
- **Origin Access Identity**: Configured for bucket access
- **Domain**: `media.octonius.com`
- **Behaviors**: 
  - Default behavior for all file types
  - Caching optimized for static assets

## File Organization

Files are organized in S3 with this structure:
```
your-private-bucket/
├── workplaces/
│   └── {workplace-id}/
│       └── users/
│           └── {user-id}/
│               └── files/
│                   ├── {uuid}.pdf
│                   ├── {uuid}.jpg
│                   └── ...
```

**CDN URLs**: `https://media.octonius.com/workplaces/{workplace-id}/users/{user-id}/files/{uuid}.pdf`

## URL Types & Usage

### Secure Download URLs (Presigned)
- **Use for**: Secure downloads requiring authentication
- **Expires**: 1 hour (3600 seconds)
- **Access**: Requires valid presigned URL
- **Best for**: File downloads initiated by authenticated users

### CDN URLs (Public)
- **Use for**: Direct file access, embedding in emails, sharing
- **Expires**: Never (permanent)
- **Access**: Public through CDN
- **Best for**: Image display, document previews, public sharing

### When to Use Which URL

```javascript
// For secure downloads (user-initiated)
const secureDownload = result.data.download_url;

// For displaying images in UI
const imageDisplay = result.data.cdn_url;

// For email attachments or sharing
const shareableLink = result.data.cdn_url;

// For temporary access
const temporaryAccess = result.data.download_url;
```

## Error Handling

The system handles these error scenarios:
- Invalid file types or sizes
- S3 upload failures  
- Expired presigned URLs
- Missing file metadata
- Access permission errors

Always implement proper error handling on the frontend to provide good user experience.

## Security Features

- **Presigned URLs** - Time-limited, secure upload URLs
- **File encryption** - Server-side encryption (AES256) 
- **Access control** - Group-based file permissions
- **Metadata validation** - Server validates all file operations
- **Audit logging** - All operations are logged

## Migration Notes

This new system is designed to work alongside the existing local file upload system. Files uploaded via S3 are stored with `content.uploadType = 's3'` while legacy files use local storage.

The download system automatically detects the storage type and provides appropriate download methods. 