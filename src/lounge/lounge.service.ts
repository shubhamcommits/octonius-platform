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
    return LoungeStory.create(data as any);
  }

  async update(uuid: string, data: UpdateLoungeStoryDto) {
    const story = await LoungeStory.findByPk(uuid);
    if (!story) return null;
    return story.update(data as any);
  }

  async delete(uuid: string) {
    const story = await LoungeStory.findByPk(uuid);
    if (!story) return null;
    await story.destroy();
    return story;
  }
} 