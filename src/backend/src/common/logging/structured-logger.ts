export type StructuredLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type StructuredLogFields = Record<string, unknown>;

export const writeStructuredLog = (
  level: StructuredLogLevel,
  message: string,
  fields: StructuredLogFields = {},
): void => {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  });

  if (level === 'error') {
    console.error(entry);
  } else if (level === 'warn') {
    console.warn(entry);
  } else {
    console.log(entry);
  }
};
