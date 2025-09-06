import { Request } from 'express'

export interface ValidationError {
  code: string
  message: string
}

export const validateParameters = (parameters: any): ValidationError[] => {
  const errors: ValidationError[] = []
  
  Object.entries(parameters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      errors.push({
        code: `validation/missing-${key}`,
        message: `${key} is required.`
      })
    }
  })
  
  return errors
}

export const validateJSON = (jsonObject: any): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (!jsonObject || Object.keys(jsonObject).length === 0) {
    errors.push({
      code: 'validation/missing-json',
      message: 'JSON Body is required.'
    })
  }
  
  return errors
}

export const validateDates = (dates: string[]): ValidationError[] => {
  const errors: ValidationError[] = []
  
  dates.forEach((date, index) => {
    if (date && !isIsoDate(date)) {
      errors.push({
        code: `validation/invalid-${date}`,
        message: 'provided date is invalid.'
      })
    }
  })
  
  return errors
}

export const isValidProperty = (property_name: any): boolean => {
  return property_name !== undefined && property_name !== null
}

export const isIsoDate = (str: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(str)) return false
  const d = new Date(str)
  return d instanceof Date && !isNaN(d.getTime()) && d.toISOString() === str
}

export const findEmptyProperties = (jsonObject: any): string[] => {
  const emptyProperties: string[] = []
  
  Object.entries(jsonObject).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      emptyProperties.push(key)
    }
  })
  
  return emptyProperties
}

export const validatePagination = (pageSize: number, pageNumber: number): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (pageSize > 100 || pageSize < 1) {
    errors.push({
      code: 'validation/invalid-page-size',
      message: 'Page size must be between 1 and 100.'
    })
  }
  
  if (pageNumber < 1) {
    errors.push({
      code: 'validation/invalid-page-number',
      message: 'Page number must be greater than 0.'
    })
  }
  
  return errors
}

export const validateUUID = (uuid: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  if (!uuidRegex.test(uuid)) {
    errors.push({
      code: 'validation/invalid-uuid',
      message: 'Invalid UUID format.'
    })
  }
  
  return errors
}

export const validateEmail = (email: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(email)) {
    errors.push({
      code: 'validation/invalid-email',
      message: 'Invalid email format.'
    })
  }
  
  return errors
}

export const validatePhone = (phone: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  
  if (!phoneRegex.test(phone)) {
    errors.push({
      code: 'validation/invalid-phone',
      message: 'Invalid phone number format. Must be in international format (e.g., +1234567890).'
    })
  }
  
  return errors
}

export const validateEnvironment = (environment: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  const validEnvironments = ['dev', 'staging', 'prod', 'local']
  
  if (!validEnvironments.includes(environment)) {
    errors.push({
      code: 'validation/invalid-environment',
      message: `Invalid environment. Must be one of: ${validEnvironments.join(', ')}.`
    })
  }
  
  return errors
}
