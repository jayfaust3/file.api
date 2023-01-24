import { AWSConfig } from "./AWSConfig";

export interface S3Config extends AWSConfig {
    bucketName: string;
    dirName?: string;
}