export default () => ({
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshExpiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 30),
  },
});
