import { LoungeStory } from './lounge.model';
import { CreateLoungeStoryDto, UpdateLoungeStoryDto } from './lounge.type';

export class LoungeService {
  async getAll() {
    return LoungeStory.findAll({ order: [['date', 'DESC']] });
  }

  async getByUuid(uuid: string) {
    return LoungeStory.findByPk(uuid);
  }

  async create(data: CreateLoungeStoryDto) {
    // Transform and validate the data before creating
    const transformedData = this.transformStoryData(data);
    return LoungeStory.create(transformedData as any);
  }

  async update(uuid: string, data: UpdateLoungeStoryDto) {
    const story = await LoungeStory.findByPk(uuid);
    if (!story) return null;
    
    // Transform and validate the data before updating
    const transformedData = this.transformStoryData(data);
    return story.update(transformedData as any);
  }

  async delete(uuid: string) {
    const story = await LoungeStory.findByPk(uuid);
    if (!story) return null;
    await story.destroy();
    return story;
  }

  private transformStoryData(data: any) {
    const transformed = { ...data };
    
    // Handle event_date field
    if (transformed.event_date) {
      const eventDate = new Date(transformed.event_date);
      if (isNaN(eventDate.getTime())) {
        // Invalid date, set to null
        transformed.event_date = null;
      } else {
        transformed.event_date = eventDate;
      }
    } else {
      transformed.event_date = null;
    }

    // Handle date field
    if (transformed.date) {
      const date = new Date(transformed.date);
      if (isNaN(date.getTime())) {
        // Invalid date, use current date
        transformed.date = new Date();
      } else {
        transformed.date = date;
      }
    } else {
      transformed.date = new Date();
    }

    // Handle attendees array
    if (transformed.attendees && !Array.isArray(transformed.attendees)) {
      transformed.attendees = null;
    }

    return transformed;
  }
} 