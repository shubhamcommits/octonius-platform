import { DataTypes, Model } from 'sequelize';
// Import User and Group models for associations
import { User } from '../../users/user.model';
import { Group } from '../group.model';
// Import Database Class
import { db } from '../../sequelize';

/**
 * GroupActivityPost Model
 * Represents a post in a group's activity feed
 */
export class GroupActivityPost extends Model {
  public uuid!: string;
  public group_id!: string;
  public user_id!: string;
  public content!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public static associate(models: any) {
    GroupActivityPost.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      targetKey: 'uuid',
      as: 'user' 
    });
    GroupActivityPost.belongsTo(models.Group, { 
      foreignKey: 'group_id', 
      targetKey: 'uuid',
      as: 'group' 
    });
  }
}

GroupActivityPost.init({
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  group_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'groups',
      key: 'uuid'
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize: db,
  tableName: 'group_activity_posts',
  modelName: 'GroupActivityPost',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['group_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

/**
 * GroupActivityLike Model
 * Represents a like on a group activity post
 */
export class GroupActivityLike extends Model {
  public uuid!: string;
  public post_id!: string;
  public user_id!: string;
  public readonly created_at!: Date;

  public static associate(models: any) {
    GroupActivityLike.belongsTo(models.GroupActivityPost, { foreignKey: 'post_id', targetKey: 'uuid', as: 'post' });
    GroupActivityLike.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'uuid', as: 'user' });
  }
}

GroupActivityLike.init({
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'group_activity_posts', key: 'uuid' },
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'uuid' },
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize: db,
  tableName: 'group_activity_likes',
  modelName: 'GroupActivityLike',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['post_id', 'user_id'] },
    { fields: ['post_id'] },
    { fields: ['user_id'] }
  ]
});

export class GroupActivityComment extends Model {
  public uuid!: string;
  public post_id!: string;
  public user_id!: string;
  public content!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public static associate(models: any) {
    GroupActivityComment.belongsTo(models.GroupActivityPost, { foreignKey: 'post_id', targetKey: 'uuid', as: 'post' });
    GroupActivityComment.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'uuid', as: 'user' });
  }
}

GroupActivityComment.init({
  uuid: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  post_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'group_activity_posts', key: 'uuid' },
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'uuid' },
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize: db,
  tableName: 'group_activity_comments',
  modelName: 'GroupActivityComment',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['post_id'] },
    { fields: ['user_id'] },
    { fields: ['created_at'] }
  ]
}); 