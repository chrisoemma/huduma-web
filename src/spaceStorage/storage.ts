import { DO_SPACES_ACCESS_KEY, DO_SPACES_BUCKET_NAME, DO_SPACES_ENDPOINT, DO_SPACES_REGION, DO_SPACES_SECRET_KEY } from "@/utils/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// Validate and load environment variables
const endpoint = DO_SPACES_ENDPOINT;
const region = DO_SPACES_REGION;
const accessKeyId = DO_SPACES_ACCESS_KEY;
const secretAccessKey = DO_SPACES_SECRET_KEY;
const bucketName = DO_SPACES_BUCKET_NAME;

if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucketName) {
  throw new Error("Missing required DigitalOcean Spaces environment variables.");
}

// Create an S3 client configured for DigitalOcean Spaces
const s3 = new S3Client({
  endpoint, 
  region, 
  credentials: {
    accessKeyId,    
    secretAccessKey 
  },
  forcePathStyle: true,
});

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

    // Construct the file URL using the CDN endpoint
    const fileUrl = `${endpoint}/${uploadParams.Key}`;

    console.log("File uploaded successfully:", fileUrl);
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
