import { Request, RequestHandler } from 'express';
import requestMiddleware from '../../middleware/request-middleware';
import { S3Service } from '../../services/aws/S3Service';
import { APIResponse } from '../../models/api/APIResponse';
import { File } from '../../models/dto/File';

const get: RequestHandler = async (req: Request<{}, APIResponse<File>, {}>, res) => {
    const s3Service = new S3Service();

    const bucketName: string = req.query.bucketName as string;
    const directory: string = req.query.directory as string;
    const name: string = req.query.name as string;
    const contentType: string = (req.query.contentType as string).replace('|', '/');

    const file: File = await s3Service.getFile(bucketName, directory, name, contentType);

    res.status(200).send({
        data: file
    });
};

export default requestMiddleware(get);
