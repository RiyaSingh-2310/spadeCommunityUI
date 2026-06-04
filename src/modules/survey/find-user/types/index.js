/**
 * @typedef {Object} FindUserFilterRow
 * @property {string} id
 * @property {string} questionId
 * @property {string} answer
 */

/**
 * @typedef {Object} FindUserRecord
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} mobile
 * @property {"Yes" | "No"} preScreenCompleted
 * @property {string} joiningDate
 * @property {"Invited" | "Not Invited" | "Opened" | "Completed"} inviteStatus
 * @property {number} earnedPoints
 * @property {string} message
 * @property {"Active" | "Inactive"} status
 */

/**
 * @typedef {Object} QuestionOption
 * @property {string} id
 * @property {string} label
 */

export {};
