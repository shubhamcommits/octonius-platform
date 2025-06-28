import { Model, DataTypes } from 'sequelize';
import { db } from '../sequelize';

export class File extends Model {
  declare id: string;
  declare name: string;
  declare type: 'note' | 'file';
  declare icon: string;
  declare user_id: string;
  declare workplace_id: string;
  declare title?: string;
  declare content?: any;
  declare size?: number;
  declare mime_type?: string;
  declare last_modified: Date;
  declare created_at: Date;
  declare updated_at: Date;
}

File.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('note', 'file'),
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'uuid',
      },
    },
    workplace_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'workplaces',
        key: 'uuid',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_modified: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
  },
  {
    sequelize: db,
    modelName: 'File',
    tableName: 'files',
    timestamps: true,
    underscored: true,
  }
); 