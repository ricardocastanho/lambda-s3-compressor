# AWS Lambda function to compress s3 images

This AWS Lambda function contains the [Sharp](https://sharp.pixelplumbing.com/) library, which is a high-performance Node.js image processing library.

**Note: This layer is compatible with Node.js 18.x runtime on AWS Lambda.**

## Usage

To use this layer, you need to download the provided zip file and publish it as a Lambda Layer in your AWS account.

1. Download the Sharp Lambda Layer zip file from the [releases page](https://github.com/Umkus/lambda-layer-sharp/releases).

2. Use the AWS CLI to publish the layer:

```bash
aws lambda publish-layer-version \
    --layer-name sharp \
    --description "Sharp layer" \
    --license-info "Apache License 2.0" \
    --zip-file fileb://sharp-layer.zip \
    --compatible-runtimes nodejs18.x \
    --compatible-architectures x86_64 arm64
```

Make sure you're in the same level with `sharp-layer.zip` when running the AWS CLI command.

The layer will now be available for you to use in your Lambda functions.

## License

This AWS Lambda Layer for Sharp is licensed under the Apache License 2.0.
