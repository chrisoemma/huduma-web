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

  export async function validateNIDANumber(nidaNumber) {
    // Replace 'YOUR_API_ENDPOINT' with the actual API endpoint for NIDA validation
    const apiEndpoint = `https://ors.brela.go.tz/um/load/load_nida/${nidaNumber}`;
  
    try {
      // Make a fetch request to the NIDA validation API
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        // Handle non-successful responses (e.g., network error, server error)
        throw new Error(`Failed to validate NIDA number. Status: ${response.status}`);
      }
  
      const result = await response.json();
  
      if (result.obj && result.obj.result && result.obj.result.NIN === nidaNumber) {
    
        return {
          status: 'Validated',
          data: result.obj.result,
        };
      } else {
        return {
          status: 'Invalid',
          error: result.obj.error || 'Unknown error during validation',
        };
      }
    } catch (error) {

      return {
        status: 'Error',
        error: error.message || 'Unknown error during validation',
      };
    }
  }

  export const monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  
  export const getMonthName = (monthNumber) => {
    return monthNames[parseInt(monthNumber, 10) - 1];
  };


  //reqested services
  export const combineSubServices = (item) => {
    return (
      item?.request_sub_services?.map((subService) => {
        const providerSubListData = item.provider_sub_list.find(
          (providerSub) => providerSub.sub_service_id === subService.sub_service_id || providerSub.provider_sub_service_id === subService.provider_sub_service_id
        );
  
        return {
          ...subService,
          provider_sub_list: providerSubListData,
        };
      }) || []
    );
  };


  export function getStatus(status) {
    switch (status) {
      case 'Pending approval':
      case 'Active':
      case 'Deactivate': // Consider changing to 'Inactive' for consistency
        return status;
      default:
        return 'Unknown'; // or any default status you prefer
    }
  }



export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate the scaling factor
      const scaleFactor = Math.min(maxWidth / width, maxHeight / height);

      // Apply the scaling factor to maintain aspect ratio
      width = Math.round(width * scaleFactor);
      height = Math.round(height * scaleFactor);

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      }, file.type);
    };
    img.onerror = (err) => {
      reject(err);
    };
  });
};

  