import { BadRequestException } from '@nestjs/common';
import { reportQuerySchema } from '@pharmaos/shared';

// Un fuseau IANA valide est accepté par Intl ; sinon RangeError.
function isTimeZone(value: string) {
  if (!/^[A-Za-z0-9_+\-/]+$/.test(value)) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true; } catch { return false; }
}

export function parseReportQuery(input: unknown) {
  const result = reportQuerySchema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  if (!isTimeZone(result.data.timeZone)) throw new BadRequestException('Fuseau horaire inconnu');
  return result.data;
}
