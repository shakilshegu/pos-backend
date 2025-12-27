import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL!,
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

if (!config.jwt.secret) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
