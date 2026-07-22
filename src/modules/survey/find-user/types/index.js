/**
 * @typedef {Object} FindUserFilterRow
 * @property {string} id
 * @property {string} questionId
 * @property {string[]} answers
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
 * @typedef {Object} FindUserQuestion
 * @property {string} id
 * @property {string} question_title
 * @property {string} [question_text]
 * @property {string[] | null} options
 */

export {};
