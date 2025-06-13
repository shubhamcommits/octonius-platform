// Import response module
import { Response } from 'express'

// Import logger module
import logger from '../logger'

/**
 * Sends an error response to the client with optional logging.
 * This function handles errors by logging them and sending a structured JSON response.
 *
 * @param {Response} res - Express response object
 * @param {any} stack - The stack trace or error details
 * @param {any} [message] - The error message to send to the client
 * @param {any} [code] - The HTTP status code to send (default is 500)
 * @param {any} [type] - An optional type identifier for specific error handling
 */
export function sendError(res: Response, stack: any, message: any, code: any, type?: any) {

	// Log the error details
	logError(res, stack, message, code)

	// General error handling and response
	const error: any = {
		code: code || 500,
		timestamp: new Date().toISOString(),
		message: message || 'Internal server error',
		details: stack || 'No stack trace available'
	}

	// Return a JSON response with the error details
	return res.status(code || 500).json({
		success: false,
		error: error
	})
}

/**
 * Logs error details to the console and logger.
 * This function logs the provided error information using the logger utility and prints it to the console.
 *
 * @param {Response} res - Express response object
 * @param {any} stack - The stack trace or error details
 * @param {any} [message] - The error message to log
 * @param {any} [code] - The HTTP status code associated with the error
 */
export function logError(res: Response, stack: any, message?: any, code?: any) {

	// Add a new line for better console readability
	process.stdout.write(`\n`)

	// Print the error
	console.error('Error: ', stack)

	// Ensure the stack trace is safely converted to a string
	const stackDetails = stack?.toString() || 'No stack trace available'

	// Log the error using the logger utility
	logger.error('Error', {
		msg: message || 'Internal server error',
		code: code || 500,
		url: `${res.req.protocol}://${res.req.get('host')}${res.req.originalUrl}`,
		details: stackDetails
	})

	// Add a new line for better console readability
	process.stdout.write(`\n`)
}

/**
 * Sends a validation error response to the client.
 * This function is used to handle and respond to validation errors by logging the details and returning a 400 status code.
 *
 * @param {Response} res - Express response object
 * @param {any} errors - The validation errors to be logged and sent to the client
 */
export function sendValidationError(res: Response, errors: any) {

	// Add a new line for better console readability
	process.stdout.write(`\n`)

	// Log the validation error using the logger utility
	logger.error('Error', {
		msg: 'Invalid request parameters.',
		code: 400,
		url: `${res.req.protocol}://${res.req.get('host')}${res.req.originalUrl}`,
		details: errors
	})

	// Add a new line for better console readability
	process.stdout.write(`\n`)

	// Return a JSON response with the validation error details
	return res.status(400).json({
		success: false,
		error: {
			code: 400,
			timestamp: new Date().toISOString(),
			message: 'Invalid request parameters.',
			details: errors
		}
	})
}
