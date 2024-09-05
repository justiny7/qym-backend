// src/models/user.model.js
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING,  // URL or path to the profile picture
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,  // Ensures that the email format is valid
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    affiliatedAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,  // Indicates whether the user has admin rights
    },
    membershipStatus: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Banned'),
      defaultValue: 'Active',
    },
    currentWorkoutLogId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    timestamps: true,  // Adds createdAt and updatedAt fields
  });

  // Associations
  User.associate = function(models) {
    User.hasMany(models.WorkoutLog, {
      foreignKey: 'userId',
      as: 'workoutLogs',
    });

    User.hasOne(models.QueueItem, {
      foreignKey: 'userId',
      as: 'queueItem',
    });
  };

  return User;
};
