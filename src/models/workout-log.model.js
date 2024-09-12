// src/models/workout-log.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const WorkoutLog = sequelize.define('WorkoutLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    timeOfTagOff: {
      type: DataTypes.DATE,
    }
  }, {
    timestamps: true,
    updatedAt: false,
    createdAt: 'timeOfTagOn',
    indexes: [
      {
        fields: ['userId', 'id']
      },
      {
        fields: ['machineId', 'id']
      }
    ],
  });

  WorkoutLog.associate = function(models) {
    WorkoutLog.belongsTo(models.Machine, {
      foreignKey: 'machineId',
      as: 'machine',
      allowNull: false
    });

    WorkoutLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    WorkoutLog.hasMany(models.WorkoutSet, {
      foreignKey: 'workoutLogId',
      as: 'workoutSets',
    });
  };

  return WorkoutLog;
};