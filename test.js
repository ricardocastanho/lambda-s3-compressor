import { handler } from "./index.js"

(async () => {
  const response = await handler({ bucket: "compressor-dev", key: "test.png" });
  console.log({ response });
})();
