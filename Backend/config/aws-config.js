import AWS from "aws-sdk";
import "dotenv/config";

AWS.config.update({ region: process.env.r });

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.awsAccess,
    secretAccessKey: process.env.awsPass,
  },
});

const S3_BUCKET = process.env.bucket;
console.log(process.env.r, process.env.bucket);

export { s3, S3_BUCKET };
