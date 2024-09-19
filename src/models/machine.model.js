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
    maximumSessionDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 20 * 60 * 1000, // default 20 minutes
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

    Machine.hasMany(models.MachineReport, {
      foreignKey: 'machineId',
      as: 'machineReports'
    });

    Machine.belongsTo(models.User, {
      foreignKey: 'gymId',
      as: 'gym',
      allowNull: false
    });
  };

  return Machine;
};
