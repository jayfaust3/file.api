import { Request, RequestHandler } from 'express';
import Joi from '@hapi/joi';
import requestMiddleware from '../../middleware/request-middleware';
import { S3Service } from '../../services/aws/S3Service';
import { APIResponse } from '../../models/api/APIResponse';
import { File } from '../../models/dto/File';

export const fileSchema = Joi.object().keys({
  bucketName: Joi.string().required(),
  directory: Joi.string().required(),
  name: Joi.string().required(),
  contentType: Joi.string().required(),
  content: Joi.string().required()
});

const post: RequestHandler = async (req: Request<{}, APIResponse<File>, File>, res) => {
  let file: File = req.body;

  const s3Service = new S3Service();

  file = await s3Service.uploadFile(file);

  res.status(201).send({
    data: file
  });
};

export default requestMiddleware(post, { validation: { body: fileSchema } });
