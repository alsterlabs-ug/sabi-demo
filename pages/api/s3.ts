import * as AWS from "aws-sdk";
import type { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import axios from "axios";

export const config = {
  api: {
    bodyParser: false,
  },
};

//configuring the AWS environment
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

const Bucket = "matny-playground";
const Delimiter = "/";

// 60 mins
const SignedUrlExpireSeconds = 60 * 60;

const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    try {
      const {
        path: Prefix,
        getSignedUrls,
        signedUrl,
      } = JSON.parse(buf.toString());
      console.log(Prefix, getSignedUrls, signedUrl);

      if (signedUrl) {
        const { data } = await axios.get(signedUrl);
        res.status(200).json(data);
        return;
      }
      const data = await s3
        .listObjectsV2({
          Bucket,
          Delimiter,
          ...(Prefix && { Prefix: `${Prefix}/` }),
        })
        .promise();

      if (getSignedUrls && data?.Contents) {
        const { Contents } = data;
        let index = 0;
        for await (const item of Contents) {
          const signedUrl = await s3.getSignedUrl("getObject", {
            Bucket,
            Key: item.Key,
            Expires: SignedUrlExpireSeconds,
          });
          Contents[index] = { ...item, ...(signedUrl && { signedUrl }) };
          index++;
        }
        data.Contents = Contents;
      }
      res.status(200).json(data);
    } catch (error) {
      res.status(400).json({ error });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export default handler;
