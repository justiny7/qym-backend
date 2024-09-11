// src/models/machine.model.js
import DataTypes from 'sequelize';

export default (sequelize) => {
  // Define the Machine model
  const Machine = sequelize.define('Machine', {
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    averageUsageTime: {
      type: DataTypes.FLOAT,
      defaultValue: 600, // 10 minutes to begin with (offset outliers)
    },
    lastTenSessions: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      defaultValue: Array(10).fill(600), // 10 minutes to begin with
    },
    maximumSessionDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 1200, // default 20 minutes
    },
    maximumQueueSize: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
    },
    maintenanceStatus: {
      type: DataTypes.ENUM('Good', 'Needs Maintenance', 'Under Repair'),
      defaultValue: 'Good',
    },
    location: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      defaultValue: [0, 0.0, 0.0], // [floor #, x, y]
    },
    manufacturerDetails: {
      type: DataTypes.JSONB,
    },
    currentWorkoutLogId: {
      type: DataTypes.UUID,
    },
  }, {
    timestamps: true,  // Adds createdAt and updatedAt timestamps
    indexes: [
      {
        fields: ['gymId', 'id']
      }
    ]
  });

  Machine.associate = function(models) {
    Machine.hasMany(models.WorkoutLog, {
      foreignKey: 'machineId',
      as: 'workoutLogs'
    });

    Machine.hasMany(models.QueueItem, {
      foreignKey: 'machineId',
      as: 'queueItems'
    });

    Machine.belongsTo(models.User, {
      foreignKey: 'gymId',
      as: 'gym',
      allowNull: false
    });
  };

  return Machine;
};
