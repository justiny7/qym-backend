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
    date_registered: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    active_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    estimated_waiting_time: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    average_usage_time: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    maintenance_status: {
      type: DataTypes.ENUM('Good', 'Needs Maintenance', 'Under Repair'),
      defaultValue: 'Good',
    },
    location_inside_gym: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reps: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    sets: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    manufacturer_details: {
      type: DataTypes.JSONB,
    },
  }, {
    timestamps: true,  // Adds createdAt and updatedAt timestamps
  });

  // Find all avaiable machines
  Machine.findAvailable = function() {
    return this.findAll({
      where: {
        active_status: true,
        maintenance_status: 'Good'
      }
    });
  };

  Machine.associate = function(models) {
    Machine.hasMany(models.WorkoutLog, {
      foreignKey: 'machineId',
      as: 'workoutLogs'
    });

    Machine.belongsTo(models.WorkoutLog, {
      as: 'currentWorkoutLog',
      foreignKey: 'currentWorkoutLogId',
    });
  };

  return Machine;
};
