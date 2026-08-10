// backend/src/middleware/validator.js
import { ValidationError } from './errorHandler.js';

/**
 * Validate request against a schema
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const errors = [];
    
    // Validate body
    if (schema.body) {
      const validation = validateObject(req.body, schema.body);
      if (validation.errors.length > 0) {
        errors.push({ field: 'body', errors: validation.errors });
      }
    }
    
    // Validate query
    if (schema.query) {
      const validation = validateObject(req.query, schema.query);
      if (validation.errors.length > 0) {
        errors.push({ field: 'query', errors: validation.errors });
      }
    }
    
    // Validate params
    if (schema.params) {
      const validation = validateObject(req.params, schema.params);
      if (validation.errors.length > 0) {
        errors.push({ field: 'params', errors: validation.errors });
      }
    }
    
    if (errors.length > 0) {
      return next(new ValidationError('Validation failed', errors));
    }
    
    next();
  };
};

/**
 * Validate an object against a schema
 */
const validateObject = (data, schema) => {
  const errors = [];
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    
    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${key} is required`);
      continue;
    }
    
    // Skip validation if value is undefined/null and not required
    if (value === undefined || value === null) {
      continue;
    }
    
    // Type checks
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`${key} must be of type ${rules.type}`);
        continue;
      }
    }
    
    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} must be at most ${rules.maxLength} characters`);
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} has invalid format`);
      }
      if (rules.email && !isValidEmail(value)) {
        errors.push(`${key} must be a valid email`);
      }
      if (rules.phone && !isValidPhone(value)) {
        errors.push(`${key} must be a valid phone number`);
      }
    }
    
    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${key} must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${key} must be at most ${rules.max}`);
      }
    }
    
    // Array validations
    if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${key} must be an array`);
      } else {
        if (rules.minItems && value.length < rules.minItems) {
          errors.push(`${key} must have at least ${rules.minItems} items`);
        }
        if (rules.maxItems && value.length > rules.maxItems) {
          errors.push(`${key} must have at most ${rules.maxItems} items`);
        }
        if (rules.items && rules.items.type) {
          for (let i = 0; i < value.length; i++) {
            if (typeof value[i] !== rules.items.type) {
              errors.push(`${key}[${i}] must be of type ${rules.items.type}`);
            }
          }
        }
      }
    }
    
    // Object validations
    if (rules.type === 'object' && typeof value === 'object' && !Array.isArray(value)) {
      if (rules.schema) {
        const nestedValidation = validateObject(value, rules.schema);
        if (nestedValidation.errors.length > 0) {
          errors.push(...nestedValidation.errors.map(e => `${key}.${e}`));
        }
      }
    }
    
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
    }
    
    // Custom validator
    if (rules.custom && typeof rules.custom === 'function') {
      const customResult = rules.custom(value, data);
      if (customResult !== true && typeof customResult === 'string') {
        errors.push(`${key}: ${customResult}`);
      }
    }
  }
  
  return { errors };
};

/**
 * Email validation
 */
export const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
};

/**
 * Phone validation
 */
export const isValidPhone = (phone) => {
  // Malawi phone number format
  const regex = /^(\+265|0)?[1-9]\d{7,8}$/;
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
 * Sanitize input (remove dangerous characters)
 */
export const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data
      .trim()
      .replace(/[<>]/g, '') // Remove < > to prevent XSS
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Common validation schemas
 */
export const schemas = {
  // User registration
  register: {
    body: {
      email: { type: 'string', required: true, email: true },
      password: { type: 'string', required: true, minLength: 8 },
      fullName: { type: 'string', required: true, minLength: 2, maxLength: 100 },
      phone: { type: 'string', phone: true },
    },
  },
  
  // User login
  login: {
    body: {
      email: { type: 'string', required: true, email: true },
      password: { type: 'string', required: true },
    },
  },
  
  // Create business
  createBusiness: {
    body: {
      businessName: { type: 'string', required: true, minLength: 3, maxLength: 100 },
      category: { type: 'string', required: true },
      phone: { type: 'string', phone: true },
      address: { type: 'string', maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
    },
  },
  
  // Create listing
  createListing: {
    body: {
      businessId: { type: 'string', required: true, custom: (value) => {
        if (!isValidUUID(value)) return 'Invalid business ID format';
        return true;
      }},
      title: { type: 'string', required: true, minLength: 3, maxLength: 100 },
      description: { type: 'string', maxLength: 2000 },
      category: { type: 'string', required: true },
      price: { type: 'number', min: 0 },
      status: { type: 'string', enum: ['active', 'draft', 'sold'] },
    },
  },
  
  // Pagination
  pagination: {
    query: {
      limit: { type: 'number', min: 1, max: 100 },
      offset: { type: 'number', min: 0 },
    },
  },
  
  // ID param
  idParam: {
    params: {
      id: { type: 'string', required: true, custom: (value) => {
        if (!isValidUUID(value)) return 'Invalid ID format';
        return true;
      }},
    },
  },
};

export default {
  validateRequest,
  validateObject,
  isValidEmail,
  isValidPhone,
  isValidUUID,
  isValidURL,
  sanitizeInput,
  schemas,
};