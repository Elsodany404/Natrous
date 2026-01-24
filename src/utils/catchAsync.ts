import type { Request, Response, NextFunction, RequestHandler } from 'express';

const catchAsync = (
  asyncFunc: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    asyncFunc(req, res, next).catch(next);
  };
};

export default catchAsync;
