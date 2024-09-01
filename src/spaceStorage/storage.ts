import { DO_SPACES_ACCESS_KEY, DO_SPACES_BUCKET_NAME, DO_SPACES_ENDPOINT, DO_SPACES_REGION, DO_SPACES_SECRET_KEY } from "@/utils/config";
import { S3Client, PutObjectCommand, HeadBucketCommand, ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Check if all required environment variables are set
// if (!DO_SPACES_ENDPOINT || !DO_SPACES_REGION || !DO_SPACES_ACCESS_KEY || !DO_SPACES_SECRET_KEY || !DO_SPACES_BUCKET_NAME) {
//   console.log("Missing required DigitalOcean Spaces environment variables.");
// }

// Configure the S3 client with the imported environment variables
const s3 = new S3Client({
  endpoint:"https://esms.espeservice.com/spaces",
   forcePathStyle: false, 
    region: "us-east-1",
  credentials: {
    accessKeyId:"DO003D7QG49H4WDWM2RB",
    secretAccessKey:"adS892bPO3hvA92CrZNZOXZmEmEo8ZqJCS0Gfx8Pa2o",
  },
 
});

export { s3, DO_SPACES_BUCKET_NAME };

// Example functions to interact with DigitalOcean Spaces

export const testConnection = async () => {
  try {
    console.log("Testing connection to S3...");
    const command = new HeadBucketCommand({ Bucket:"espedocs" });
    await s3.send(command);
    console.log("Connection successful! Credentials are accepted and the bucket is accessible.");
  } catch (error) {
    console.error("Connection test failed:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
  }
};

export const listBuckets = async () => {
  try {
    console.log("Listing all buckets...");
    const command = new ListBucketsCommand({});
    const response = await s3.send(command);
    console.log("Buckets:", response.Buckets);
  } catch (error) {
    console.error("Failed to list buckets:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
  }
};

export const listObjects = async () => {
  try {
    console.log(`Listing objects in bucket: espedocs...`);
    const command = new ListObjectsV2Command({ Bucket:"espedocs" });
    const response = await s3.send(command);
    console.log("Objects in bucket:", response.Contents);
  } catch (error) {
    console.error("Failed to list objects:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
  }
};

export const uploadToDigitalOcean = async (file, fileName, fileType) => {
  try {
    const uploadParams = {
      Bucket: "espedocs",
      Key:`test/${fileName}`,
      Body:file,
      ACL: "public-read", 
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    const fileUrl = `https://esms.espeservice.com/spaces/${uploadParams.Key}`;
    console.log("File uploaded successfully:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
