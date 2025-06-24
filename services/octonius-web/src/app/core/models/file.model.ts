export interface File {
  id: string;
  name: string;
  type: 'note' | 'file';
  icon: string;
  owner: string;
  ownerAvatar: string;
  lastModified: string;
  size?: number;
  mimeType?: string;
  title?: string;
  last_edited?: string;
  content?: any;
} 