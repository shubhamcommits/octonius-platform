export type LoungeStoryType = 'news' | 'event' | 'update';

export interface LoungeStory {
  id: string;
  title: string;
  description: string;
  type: LoungeStoryType;
  date: string;
  image?: string;
  authorId: string;
  eventDate?: string;
  location?: string;
  attendees?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoungeStoryDto {
  title: string;
  description: string;
  type: LoungeStoryType;
  date: string;
  image?: string;
  authorId: string;
  eventDate?: string;
  location?: string;
  attendees?: string[];
}

export interface UpdateLoungeStoryDto extends Partial<CreateLoungeStoryDto> {} 