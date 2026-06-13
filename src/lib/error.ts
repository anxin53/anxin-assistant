const unknownErrorMessage = '操作失败，但没有返回可读错误。';

export function readError(error: unknown): string {
  if (error instanceof Error) {
    return cleanErrorMessage(error.message);
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    for (const key of ['message', 'Message', 'error', 'details', 'reason']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return cleanErrorMessage(value);
      }
      if (value && typeof value === 'object' && value !== error) {
        return readError(value);
      }
    }
  }

  return cleanErrorMessage(String(error));
}

function cleanErrorMessage(message: string): string {
  const stripped = message
    .replace(/^Error invoking remote method '[^']+':\s*/u, '')
    .replace(/^Error:\s*/u, '')
    .trim();

  return stripped && stripped !== '[object Object]' ? stripped : unknownErrorMessage;
}
