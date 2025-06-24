// Define specified error response
interface ErrorResponse {
    code: string;
    message: string;
}

/**
 * This function is responsible for creating an error response
 * @param code 
 * @param message 
 * @returns 
 */
function createErrorResponse(code: string, message: string): ErrorResponse {
    return {
        code: code,
        message: message,
    }
}

/**
 * This function is responsible for finding empty properties present in a JSON
 * @param jsonObject 
 * @returns 
 */
function findEmptyProperties(jsonObject: any): string[] {
    const emptyProperties: string[] = [];
    for (const [key, value] of Object.entries(jsonObject)) {
        if (value === null || value === undefined || value === '' || value === ':id') {
            emptyProperties.push(key)
        } else if (typeof value === 'object') {
            emptyProperties.push(...findEmptyProperties(value))
        }
    }
    return emptyProperties
}

/**
 * This function is responsible for checking if the propery is valid or not
 * @param property_name 
 */
export function isValidProperty(property_name: any) {

    // Prperty Boolean
    let is_valid_property = true

    // Impose checks on property
    if(property_name == undefined)
        is_valid_property = false
    else if(property_name == null)
        is_valid_property = false
    else
        is_valid_property = true

    // Return result
    return is_valid_property
}

/**
 * This function checks if the current string is an ISO date or not
 * @param str 
 * @returns 
 */
export function isIsoDate(str: string) {
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/
    return isoRegex.test(str)
}

/**
 * This function is responsible for checking an empty JSON
 * @param jsonObject 
 * @returns 
 */
export function validateJSON(jsonObject: any) {

    // Req Properties Array from re.body
    let req_properties = []

    // Send Status 400 response with specific issues
    const errors: ErrorResponse[] = []

    // Iterate over each value to check if property is not underfined or null
    for (const [key, value] of Object.entries(jsonObject)) {
        if (!(key === undefined || key == null)) {
            req_properties.push(key)
        }
    }

    // Throw error in case body if is empty
    if (req_properties.length == 0) {
        errors.push({
            code: 'validation/missing-json',
            message: 'JSON Body is required.'
        })
    }

    return errors

}

/**
 * This function is responsible for validating the parameters
 * @returns 
 */
export function validateParameters(parameters: any) {

    // Send Status 400 response with specific issues
    const errors: ErrorResponse[] = []

    // Get the list of empty properties
    let emptyProperties = findEmptyProperties(parameters)

    if (emptyProperties.length > 0) {

        // Iterate over empty properties
        emptyProperties.forEach((property: any) => {

            // Append each validation property array
            errors.push(
                createErrorResponse(
                    `validation/missing-${property}`,
                    `${property} is required.`
                )
            )
        })
    }

    // Return Errors Array
    return errors

}

/**
 * This function is responsible for validating the list of dates
 * @param dates 
 * @returns 
 */
export function validateDates(dates: string[]) {

    // Send Status 400 response with specific issues
    const errors: ErrorResponse[] = []

    // Check length of dates array
    if (dates.length > 0) {

        // Iterate through each date
        dates.forEach(date => {
            
            // Validate if the date
            let isValidDate = isIsoDate(date)

            // If date is invalid
            if (!isValidDate) {

                // Append each validation property array
                errors.push(
                    createErrorResponse(
                        `validation/invalid-${date}`,
                        `provided date is invalid.`
                    )
                )
            }
        })
    }

    // Return Errors Array
    return errors
}