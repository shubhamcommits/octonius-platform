export type LoungeStoryType = 'news' | 'event' | 'update'

export interface CreateLoungeStoryDto {
  title: string;
  description: string;
  type: LoungeStoryType;
  date: string;
  image?: string;
  user_id: string;
  event_date?: string;
  location?: string;
  attendees?: string[];
}

export interface UpdateLoungeStoryDto extends Partial<CreateLoungeStoryDto> {}