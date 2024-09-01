import { DO_SPACES_ACCESS_KEY, DO_SPACES_BUCKET_NAME, DO_SPACES_ENDPOINT, DO_SPACES_REGION, DO_SPACES_SECRET_KEY } from "@/utils/config";
import { S3Client, PutObjectCommand, HeadBucketCommand, ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Check if all required environment variables are set
if (!DO_SPACES_ENDPOINT || !DO_SPACES_REGION || !DO_SPACES_ACCESS_KEY || !DO_SPACES_SECRET_KEY || !DO_SPACES_BUCKET_NAME) {
  console.log("Missing required DigitalOcean Spaces environment variables.");
}

// Configure the S3 client with the imported environment variables
const s3 = new S3Client({
  endpoint: DO_SPACES_ENDPOINT,
  region: DO_SPACES_REGION,
  credentials: {
    accessKeyId: DO_SPACES_ACCESS_KEY,
    secretAccessKey: DO_SPACES_SECRET_KEY,
  },
  forcePathStyle: true, // Uses path-style URLs (e.g., endpoint/bucket/key)
});

export { s3, DO_SPACES_BUCKET_NAME };

// Example functions to interact with DigitalOcean Spaces

export const testConnection = async () => {
  try {
    console.log("Testing connection to S3...");
    const command = new HeadBucketCommand({ Bucket: DO_SPACES_BUCKET_NAME });
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
    console.log(`Listing objects in bucket: ${DO_SPACES_BUCKET_NAME}...`);
    const command = new ListObjectsV2Command({ Bucket: DO_SPACES_BUCKET_NAME });
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
      Bucket: DO_SPACES_BUCKET_NAME,
      Key: `test/${fileName}`,
      Body: file,
      ContentType:'application/octet-stream',
      ACL: "public-read", // Makes the uploaded file publicly readable
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    const fileUrl = `${DO_SPACES_ENDPOINT}/${uploadParams.Key}`;
    console.log("File uploaded successfully:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
