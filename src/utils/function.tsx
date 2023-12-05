import { message,Space } from "antd";

export const formatErrorMessages=(errorObject)=>{
    if (!errorObject) {
        return 'Unknown error';
    }

    // If errorObject is a string, try parsing it as JSON
    if (typeof errorObject === 'string') {
        try {
            const parsedError = JSON.parse(errorObject);

            // Check if the parsed error is an object
            if (typeof parsedError === 'object') {
                // Now, you can handle the parsed error as an object
                return formatErrorMessages(parsedError);
            } else {
                // If parsing fails or the result is not an object, return the original string
                return errorObject;
            }
        } catch (parseError) {
            // Parsing failed, return the original string
            return errorObject;
        }
    }

    if (typeof errorObject === 'object') {
        let errorMessage = '';

        // Check if the errorObject has a property named 'errors'
        if (errorObject.errors) {
            for (const key in errorObject.errors) {
                if (errorObject.errors.hasOwnProperty(key) && Array.isArray(errorObject.errors[key]) && errorObject.errors[key].length > 0) {
                    errorMessage += `${errorObject.errors[key][0]}\n`;
                }
            }
        } else {
            // If 'errors' property is not found, iterate through the object directly
            for (const key in errorObject) {
                if (errorObject.hasOwnProperty(key) && Array.isArray(errorObject[key]) && errorObject[key].length > 0) {
                    errorMessage += `${errorObject[key][0]}\n`;
                }
            }
        }

        // Remove the trailing <br> before returning
        return errorMessage.trim();
    }

    return 'Unknown error';
}



export const showErrorWithLineBreaks=(errors)=>{

    const errorArray = errors.split('\n');
    message.error(
        <Space direction="vertical">
            {errorArray.map((error, index) => (
                <span key={index}>{error}</span>
            ))}
        </Space>,
        8 // The duration the message is displayed (in seconds)
    );
}


export function validateTanzanianPhoneNumber(phoneNumber) {
    // Remove any spaces and non-numeric characters
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
  
    // Check the length and format
    if (cleanedPhoneNumber.match(/^(0\d{9}|255\d{9})$/)) {
      // Valid Tanzanian phone number format
      if (cleanedPhoneNumber.startsWith('0')) {
        return `+255${cleanedPhoneNumber.substring(1)}`;
      } else if (cleanedPhoneNumber.startsWith('255')) {
        return `+${cleanedPhoneNumber}`;
      } else if (cleanedPhoneNumber.startsWith('+255')) {
        return cleanedPhoneNumber; // No change if already formatted as '+255'
      }
    } else {
      // Invalid phone number format
      return null;
    }
  }