// src/models/workout-log.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const WorkoutLog = sequelize.define('WorkoutLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    timeOfTagOn: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    timeOfTagOff: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reps: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    sets: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
  }, {
    timestamps: true,
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
  };

  return WorkoutLog;
};