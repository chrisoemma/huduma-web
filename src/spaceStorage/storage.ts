import { S3Client, PutObjectCommand, HeadBucketCommand, ListBucketsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
// import dotenv from "dotenv";

// dotenv.config();

// Load environment variables
const endpoint = process.env.DO_SPACES_ENDPOINT;
const region = process.env.DO_SPACES_REGION;
const accessKeyId = process.env.DO_SPACES_ACCESS_KEY;
const secretAccessKey = process.env.DO_SPACES_SECRET_KEY;
const bucketName = process.env.DO_SPACES_BUCKET_NAME;

if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucketName) {
  console.log("Missing required DigitalOcean Spaces environment variables.");
}

const s3 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export const testConnection = async () => {
  try {
    console.log("Testing connection to S3...");
    const command = new HeadBucketCommand({ Bucket: bucketName });
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
    console.log(`Listing objects in bucket: ${bucketName}...`);
    const command = new ListObjectsV2Command({ Bucket: bucketName });
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
      Bucket: bucketName,
      Key: `test/${fileName}`,
      Body: file,
      ContentType: fileType,
      ACL: "public-read",
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    const fileUrl = `${endpoint}/${uploadParams.Key}`;
    console.log("File uploaded successfully:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
