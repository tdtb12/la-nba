/**
 * Converts Fahrenheit to Celsius
 * @param {number} fahrenheit 
 * @returns {number} Celsius value nicely rounded
 */
export function toCelsius(fahrenheit) {
    if (fahrenheit === null || fahrenheit === undefined) return 0;
    return Math.round((fahrenheit - 32) * 5 / 9);
}
