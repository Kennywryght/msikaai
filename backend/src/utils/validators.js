// backend/src/utils/validators.js

/**
 * Email validation
 */
export const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

/**
 * Password strength validation
 */
export const validatePassword = (password) => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  return {
    valid: Object.values(checks).every(v => v === true),
    checks,
    score: Object.values(checks).filter(v => v === true).length,
  };
};

/**
 * Phone number validation (Malawi format)
 */
export const isValidPhone = (phone) => {
  const regex = /^(\+265|0)?[1-9]\d{7,8}$/;
  return regex.test(phone);
};

/**
 * International phone number validation
 */
export const isValidInternationalPhone = (phone) => {
  const regex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return regex.test(phone);
};

/**
 * UUID validation
 */
export const isValidUUID = (id) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(id);
};

/**
 * URL validation
 */
export const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Postal/ZIP code validation
 */
export const isValidPostalCode = (code) => {
  const regex = /^[0-9]{5}$/;
  return regex.test(code);
};

/**
 * Money amount validation
 */
export const isValidAmount = (amount) => {
  return typeof amount === 'number' && amount >= 0 && amount <= 999999999.99;
};

/**
 * Percentage validation
 */
export const isValidPercentage = (value) => {
  return typeof value === 'number' && value >= 0 && value <= 100;
};

/**
 * Boolean validation
 */
export const isValidBoolean = (value) => {
  return value === true || value === false || value === 'true' || value === 'false';
};

/**
 * Parse boolean from string
 */
export const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
};

/**
 * Trim and sanitize string
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate and sanitize object
 */
export const sanitizeObject = (obj, schema) => {
  const result = {};
  
  for (const [key, rules] of Object.entries(schema)) {
    if (obj[key] !== undefined) {
      let value = obj[key];
      
      if (rules.type === 'string') {
        value = sanitizeString(value);
        if (rules.maxLength && value.length > rules.maxLength) {
          value = value.substring(0, rules.maxLength);
        }
      }
      
      if (rules.type === 'number') {
        value = parseFloat(value);
        if (isNaN(value)) {
          value = 0;
        }
        if (rules.min !== undefined && value < rules.min) value = rules.min;
        if (rules.max !== undefined && value > rules.max) value = rules.max;
      }
      
      if (rules.type === 'boolean') {
        value = parseBoolean(value);
      }
      
      result[key] = value;
    } else if (rules.required) {
      throw new Error(`${key} is required`);
    }
  }
  
  return result;
};

/**
 * Compare two objects for differences
 */
export const getObjectDiff = (oldObj, newObj) => {
  const diff = {};
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  for (const key of allKeys) {
    if (oldObj[key] !== newObj[key]) {
      diff[key] = {
        old: oldObj[key],
        new: newObj[key],
      };
    }
  }
  
  return diff;
};

/**
 * Safe JSON parse with fallback
 */
export const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

export default {
  isValidEmail,
  validatePassword,
  isValidPhone,
  isValidInternationalPhone,
  isValidUUID,
  isValidURL,
  isValidPostalCode,
  isValidAmount,
  isValidPercentage,
  isValidBoolean,
  parseBoolean,
  sanitizeString,
  sanitizeObject,
  getObjectDiff,
  safeJsonParse,
};