// src/models/queue-item.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const QueueItem = sequelize.define('QueueItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    timeReachedFront: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
    updatedAt: false,
    createdAt: 'timeEnqueued',
    indexes: [
      {
        fields: ['machineId', 'timeEnqueued']
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