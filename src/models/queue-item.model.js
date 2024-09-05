// src/models/queue-item.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const QueueItem = sequelize.define('QueueItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    }
  }, {
    timestamps: true,
    updatedAt: false,
    createdAt: 'enqueueTime',
    indexes: [
      {
        fields: ['machineId', 'enqueueTime']
      }
    ]
  });

  QueueItem.associate = function(models) {
    QueueItem.belongsTo(models.Machine, {
      foreignKey: 'machineId',
      as: 'machine',
      allowNull: false
    });

    QueueItem.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      allowNull: false
    });
  };

  return QueueItem;
};