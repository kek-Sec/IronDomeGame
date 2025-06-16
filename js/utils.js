/**
 * utils.js
 * * A collection of utility and helper functions that can be used across the project.
 */

/**
 * Returns a random number between a min and max value.
 * @param {number} min - The minimum value.
 * @param {number} max - The maximum value.
 * @returns {number} A random number.
 */
export const random = (min, max) => Math.random() * (max - min) + min;
