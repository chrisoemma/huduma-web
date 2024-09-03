import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";

const s3Client = new S3({
  forcePathStyle: false,
  endpoint: "https://esms.espeservice.com/spaces",
  region: "us-east-1",
  // signatureVersion:'v4',
  credentials: {
    accessKeyId:"DO00ANAU72KKAP9L6RY7",
    secretAccessKey:"bVEnpl8slg8pFEYBXr3zcOfoOROB5UuSqGMtqXcN7Uc"
  }
});

// Function to test the connection by listing buckets
export const testS3Connection = async () => {
  try {
    // Attempt to list the buckets as a way to test the connection
    const response = await s3Client.listBuckets({});
    console.log("Connection successful. Buckets:", response.Buckets);
    return true; // Connection is successful
  } catch (error) {
       console.log('errorGenaral',error)
    if (error.name === 'CredentialsError') {
      console.error("Error: Invalid credentials. Please check your access key and secret access key.");
    } else if (error.name === 'TimeoutError') {
      console.error("Error: Connection timed out. Please check your network connection.");
    } else if (error.name === 'EndpointError') {
      console.error("Error: Invalid endpoint. Please check the S3 endpoint URL.");
    } else {
      // Generic error message for other types of errors
      console.error("Error testing S3 connection:", error.message);
    }
    // Log the complete error object for debugging purposes
    console.error("Detailed Error:", error);
    return false; // Connection failed
  }
};



export const uploadFile = async  ({ bucket, file })=> {
  try {
    // Set the key to ensure the file is placed inside the "test" folder
    let key = `test/${file.filename}`;
    
    // Create a command to upload the file to the bucket
    const command = new PutObjectCommand({
      Key: key,
      Body: file.buffer,
      Bucket: bucket,
      ACL: 'public-read', // Allows public access to the file
      ContentType: file.mimetype, // Sets the content type of the file
    });

    // Send the command to S3
    await s3Client.send(command);
    
    console.log(`File uploaded successfully to ${bucket}/${key}`);
    return key; // Return the file path in the bucket
  } catch (error) {
    // Log and handle the error
    console.error("Error uploading file:", error.message);
    throw new Error("Failed to upload file. Please try again later.");
  }
}

// Export the S3 client
export { s3Client };
