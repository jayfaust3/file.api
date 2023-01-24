import S3 from 'aws-sdk/clients/s3';
import { AWSConfig } from '../../models/config/aws/AWSConfig';
import { File } from '../../models/dto/File';

export class S3Service {
    readonly #config: AWSConfig;
    readonly #client: S3;

    constructor(config?: AWSConfig) {
        this.#config = config ?? {
            region: process.env.AWS_REGION,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        };

        this.#client = new S3({
            s3ForcePathStyle: true,
            region: this.#config.region,
            accessKeyId: this.#config.accessKeyId,
            secretAccessKey: this.#config.secretAccessKey,
            endpoint: process.env.S3_ENDPOINT,
            sslEnabled: false
        });
    }

    public async uploadFile(file: File): Promise<File> {
        try {
            await this.#client.headBucket(
                {
                    Bucket: file.bucketName
                }
            ).promise();

            const params: S3.PutObjectRequest = {
                Bucket: file.bucketName,
                Key: `${file.directory}/${file.name}`,
                ContentType: file.contentType,
                ACL: 'public-read',
                Body: Buffer.from(file.content, 'base64')
            };

            await this.#client.putObject(params).promise();
        } catch (error) {
            console.error('Unable to post file:', error);
        }

        return file;
    }

    public async getFile(
        bucketName: string,
        directory: string,
        name: string,
        contentType: string): Promise<File> {
        const params: S3.GetObjectRequest = {
            Bucket: bucketName,
            Key: `${directory}/${name}`,
            ResponseContentType: contentType
        };

        const s3Response: S3.GetObjectOutput = await this.#client.getObject(params).promise();

        return {
            bucketName,
            directory,
            name,
            contentType,
            content: Buffer.from(s3Response.Body as Uint8Array).toString('base64')
        }
    }
}
