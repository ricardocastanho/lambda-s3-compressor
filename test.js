import crypto from "crypto";
import { handler } from "./index.js";

(async () => {
  const response = await handler({
    invocationSchemaVersion: "1.0",
    invocationId: crypto.randomUUID(),
    job: {
      id: crypto.randomUUID(),
    },
    tasks: [
      {
        taskId: crypto.randomUUID(),
        s3Key: "test.png",
        s3VersionId: "1",
        s3BucketArn: "arn:aws:s3:::compressor-dev",
      },
    ],
  });
  console.log({ response });
})();
