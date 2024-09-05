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
      allowNull: true,
    }
  }, {
    timestamps: true,
    updatedAt: false,
    createdAt: 'timeOfTagOn',
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['machineId']
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
      allowNull: false
    });

    WorkoutLog.hasMany(models.WorkoutSet, {
      as: 'workoutSets',
    });
  };

  return WorkoutLog;
};