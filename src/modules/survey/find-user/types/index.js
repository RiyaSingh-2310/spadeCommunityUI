/**
 * @typedef {Object} FindUserFilterRow
 * @property {string} id
 * @property {string} questionId
 * @property {string[]} answers
 */

/**
 * @typedef {Object} FindUserRecord
 * @property {string} id
 * @property {string} [panelistId]
 * @property {string} name
 * @property {string} email
 * @property {number} balance
 * @property {string} inviteStatus
 * @property {number} earnedPoints
 * @property {string} joiningDate
 * @property {string} matchedAnswers
 * @property {string} [invitedAt]
 * @property {string} [message]
 * @property {"Active" | "Inactive" | string} status
 */

/**
 * @typedef {Object} FindUserQuestion
 * @property {string} id
 * @property {string} question_title
 * @property {string} [question_type]
 * @property {string[]} [options]
 */

export {};
