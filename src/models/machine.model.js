const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the Machine model
  const Machine = sequelize.define('Machine', {
    uuid: {
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
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maintenance_status: {
      type: DataTypes.STRING,
      defaultValue: 'Good',
    },
    location_inside_gym: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reps: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    sets: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    manufacturer_details: {
      type: DataTypes.TEXT,
    },
  }, {
    timestamps: true,  // Adds createdAt and updatedAt timestamps
  });

  return Machine;
};
