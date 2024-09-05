import db from '../models/index.js';  // Adjust the path as needed
const { QueueItem, User } = db;

class QueueItemService {
  /**
   * Adds a user to a machine's queue. Ensures a user can only be in one queue.
   * @param {string} userId - The ID of the user.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Object>} - The newly created QueueItem.
   */
  static async enqueue(userId, machineId) {
    const transaction = await db.sequelize.transaction();

    try {
      // Check if the user already has a queueItem without loading other user attributes
      const userWithQueueItem = await User.findOne({
        where: { id: userId },
        include: [{
          model: QueueItem,
          as: 'queueItem',
        }],
        attributes: []  // Don't load any user attributes
      });

      console.log(userWithQueueItem);

      // Check if the user has an associated queueItem
      if (userWithQueueItem.queueItem) {
        throw new Error('User is already in a queue.');
      }

      // Create a new QueueItem for the machine
      const newQueueItem = await QueueItem.create({ userId, machineId }, { transaction });

      await transaction.commit();
      return newQueueItem;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Retrieves the first item in a machine's queue based on creation time.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Object|null>} - The first queue item, or null if no item exists.
   */
  static async poll(machineId) {
    try {
      const firstInQueue = await QueueItem.findOne({
        where: { machineId },
        order: [['enqueueTime', 'ASC']],  // Order by creation time
        include: [{ model: User, as: 'user' }]  // Include user details
      });

      return firstInQueue || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Removes the first item in the queue for a machine.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<void>} - Resolves when the first queue item is removed.
   */
  static async dequeue(machineId) {
    const transaction = await db.sequelize.transaction();

    try {
      // Find the first item in the queue
      const firstInQueue = await QueueItem.findOne({
        where: { machineId },
        order: [['enqueueTime', 'ASC']],
        transaction
      });

      if (!firstInQueue) {
        throw new Error('Queue is empty.');
      }

      // Remove the first queue item
      await firstInQueue.destroy({ transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export default QueueItemService;
