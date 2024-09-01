import { DO_SPACES_ACCESS_KEY, DO_SPACES_BUCKET_NAME, DO_SPACES_CDN, DO_SPACES_ENDPOINT, DO_SPACES_REGION, DO_SPACES_SECRET_KEY } from "@/utils/config";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const endpoint = DO_SPACES_ENDPOINT;
const region = DO_SPACES_REGION;
const accessKeyId = DO_SPACES_ACCESS_KEY;
const secretAccessKey = DO_SPACES_SECRET_KEY;
const bucketName = DO_SPACES_BUCKET_NAME;

if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucketName) {
  throw new Error("Missing required DigitalOcean Spaces environment variables.");
}

const s3 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: false,
});

export const uploadToDigitalOcean = async (file, fileName, fileType) => {
  try {
    const uploadParams = {
      Bucket: bucketName,
      Key: `test/${fileName}`, // Ensure the correct folder path as needed
      Body: file,
      ContentType: fileType || 'application/octet-stream', // Use fileType if available
      ACL: "public-read",
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    console.log("File uploaded successfully:", `${DO_SPACES_CDN}/${uploadParams.Key}`);

    // Generate a presigned URL for the uploaded file
    const presignedUrl = await generatePresignedUrl(uploadParams.Key);
    console.log("Generated presigned URL:", presignedUrl);

    return presignedUrl; // Return the presigned URL instead of the file URL
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const generatePresignedUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Swap the domain to use the CDN URL
    const cdnUrl = `${DO_SPACES_CDN}${url.split('.com')[1]}`;
    return cdnUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
};
