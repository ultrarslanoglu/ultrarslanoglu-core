import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  message: string;
  status: string;
  timestamp: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  res.status(200).json({
    message: 'Ultrarslanoglu API çalışıyor',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}
