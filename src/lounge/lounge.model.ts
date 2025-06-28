import { DataTypes, Model, Optional } from 'sequelize';
import { db } from '../sequelize';

export interface LoungeStoryAttributes {
  id: string;
  title: string;
  description: string;
  type: 'news' | 'event' | 'update';
  date: Date;
  image?: string;
  authorId: string;
  eventDate?: Date;
  location?: string;
  attendees?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoungeStoryCreationAttributes extends Optional<LoungeStoryAttributes, 'id' | 'image' | 'eventDate' | 'location' | 'attendees' | 'createdAt' | 'updatedAt'> {}

export class LoungeStory extends Model<LoungeStoryAttributes, LoungeStoryCreationAttributes> implements LoungeStoryAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public type!: 'news' | 'event' | 'update';
  public date!: Date;
  public image?: string;
  public authorId!: string;
  public eventDate?: Date;
  public location?: string;
  public attendees?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

LoungeStory.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('news', 'event', 'update'),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  eventDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  attendees: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
  },
}, {
  sequelize: db,
  modelName: 'LoungeStory',
  tableName: 'lounge_stories',
  timestamps: true,
}); 