import { LoungeStory } from './lounge.model';
import { CreateLoungeStoryDto, UpdateLoungeStoryDto } from './lounge.type';

export class LoungeService {
  async getAll() {
    return LoungeStory.findAll({ order: [['date', 'DESC']] });
  }

  async getById(id: string) {
    return LoungeStory.findByPk(id);
  }

  async create(data: CreateLoungeStoryDto) {
    return LoungeStory.create(data as any);
  }

  async update(id: string, data: UpdateLoungeStoryDto) {
    const story = await LoungeStory.findByPk(id);
    if (!story) return null;
    return story.update(data as any);
  }

  async delete(id: string) {
    const story = await LoungeStory.findByPk(id);
    if (!story) return null;
    await story.destroy();
    return story;
  }
} 