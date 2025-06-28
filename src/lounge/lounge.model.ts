import { DataTypes, Model, Optional } from 'sequelize';
import { db } from '../sequelize';

export interface LoungeStoryAttributes {
  uuid: string;
  title: string;
  description: string;
  type: 'news' | 'event' | 'update';
  date: Date;
  image: string | null;
  user_id: string;
  event_date: Date | null;
  location: string | null;
  attendees: string[] | null;
  created_at: Date;
  updated_at: Date;
}

export interface LoungeStoryCreationAttributes extends Optional<LoungeStoryAttributes, 'uuid' | 'image' | 'event_date' | 'location' | 'attendees' | 'created_at' | 'updated_at'> {}

export class LoungeStory extends Model<LoungeStoryAttributes, LoungeStoryCreationAttributes> implements LoungeStoryAttributes {
  public uuid!: string;
  public title!: string;
  public description!: string;
  public type!: 'news' | 'event' | 'update';
  public date!: Date;
  public image!: string | null;
  public user_id!: string;
  public event_date!: Date | null;
  public location!: string | null;
  public attendees!: string[] | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Define associations
  static associate(models: any) {
    // Lounge story belongs to a user (author)
    LoungeStory.belongsTo(models.User, {
      foreignKey: 'user_id',
      targetKey: 'uuid',
      as: 'author'
    })
  }
}

LoungeStory.init({
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('news', 'event', 'update'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'uuid'
    }
  },
  event_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: [0, 255]
    }
  },
  attendees: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: true,
    defaultValue: null
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize: db,
  modelName: 'LoungeStory',
  tableName: 'lounge_stories',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['uuid']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['date']
    }
  ]
});

export default LoungeStory; 