// src/models/workout-set.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const WorkoutSet = sequelize.define('WorkoutSet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    weight: {
      type: DataTypes.FLOAT,  // Using FLOAT to accommodate decimal weights
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  }, {
    timestamps: false,
    indexes: [
      {
        fields: ['workoutLogId'],
      },
    ],
  });

  WorkoutSet.associate = function(models) {
    WorkoutSet.belongsTo(models.WorkoutLog, {
      foreignKey: 'workoutLogId',
      as: 'workoutLog',
    });
  };

  return WorkoutSet;
};
