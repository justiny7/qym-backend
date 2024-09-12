// src/models/machine-report.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const MachineReport = sequelize.define('MachineReport', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    timeResolved: {
      type: DataTypes.DATE,
    },
    reportType: {
      type: DataTypes.ENUM('Damage', 'Suggestion', 'Repair', 'Other'),
      allowNull: false,
    },
    shortDescription: {
      type: DataTypes.STRING(255), // Brief summary
      allowNull: false
    },
    detailedDescription: {
      type: DataTypes.TEXT, // Longer, detailed description
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING), // URLs or paths to images
    }
  }, {
    timestamps: true,
    updatedAt: false,
    createdAt: 'timeReported',
    indexes: [
      {
        fields: ['machineId']
      }
    ],
  });

  MachineReport.associate = function(models) {
    MachineReport.belongsTo(models.Machine, {
      foreignKey: 'machineId',
      as: 'machine',
      allowNull: false
    });
  };

  return MachineReport;
};