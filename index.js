import sharp from "sharp";

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const AWS_RESPONSES = {
  SUCESS: "Succeeded",
  TEMPORARY_FAILURE: "TemporaryFailure",
  PERMANENT_FAILURE: "PermanentFailure",
};

async function streamToString(stream) {
  return await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
  });
}

const getObject = async (client, bucket, key) => {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const { Body } = await client.send(command);
  return await streamToString(Body);
};

const putObject = async (client, bucket, key, compressedImageBuffer) => {
  const uploadParams = {
    Bucket: bucket,
    Key: `${key}`,
    Body: compressedImageBuffer,
    ContentType: "image/png",
  };

  const command = new PutObjectCommand(uploadParams);

  return await client.send(command);
};

const compressImage = async (uncompressedImage, extension, options) => {
  const metadata = await sharp(uncompressedImage).metadata();

  const img = sharp(uncompressedImage)
    .resize({
      width: metadata.width,
      height: metadata.height,
    })
    .resize();

  if (extension === "png") {
    return await img.png(options).toBuffer();
  }

  if (extension === "jpeg") {
    return await img.jpeg(options).toBuffer();
  }

  return Promise.reject(new Error("extension not supported."));
};

export const handler = async (event) => {
  try {
    const region = process.env.AWS_REGION || "us-east-1";
    const bucketName = event.tasks?.[0]?.s3BucketArn?.split(":::")?.at(-1);
    const objectKey = event.tasks?.[0]?.s3Key;
    const fileExtension = objectKey?.split(".")?.at(-1);
    const quality = process.env.IMAGE_QUALITY || 70;

    if (!bucketName || !objectKey) {
      console.error("[ERROR]: Bucket or Object key is missing.");
      return {
        invocationSchemaVersion: event.invocationSchemaVersion,
        treatMissingKeysAs: AWS_RESPONSES.PERMANENT_FAILURE,
        invocationId: event.invocationId,
        results: [
          {
            taskId: event.tasks?.[0]?.taskId,
            resultCode: AWS_RESPONSES.PERMANENT_FAILURE,
            resultString: "[ERROR]: Bucket or Object key is missing.",
          },
        ],
      };
    }

    const s3 = new S3Client({ region });

    const uncompressedImage = await getObject(s3, bucketName, objectKey);
    const bufferedImage = Buffer.from(uncompressedImage, "base64");

    const compressedImageBuffer = await compressImage(
      bufferedImage,
      fileExtension,
      { compressionLevel: 9, quality }
    );

    const response = await putObject(
      s3,
      bucketName,
      objectKey,
      compressedImageBuffer
    );

    return {
      invocationSchemaVersion: event.invocationSchemaVersion,
      treatMissingKeysAs: AWS_RESPONSES.PERMANENT_FAILURE,
      invocationId: event.invocationId,
      results: [
        {
          taskId: event.tasks?.[0]?.taskId,
          resultCode: AWS_RESPONSES.SUCESS,
          resultString: JSON.stringify(response),
        },
      ],
    };
  } catch (e) {
    console.error("[ERROR]:", e.message);
    return {
      invocationSchemaVersion: event.invocationSchemaVersion,
      treatMissingKeysAs: AWS_RESPONSES.PERMANENT_FAILURE,
      invocationId: event.invocationId,
      results: [
        {
          taskId: event.tasks?.[0]?.taskId,
          resultCode: AWS_RESPONSES.PERMANENT_FAILURE,
          resultString: "[ERROR]: " + e.message,
        },
      ],
    };
  }
};
