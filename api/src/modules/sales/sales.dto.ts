import { BadRequestException } from '@nestjs/common';
import { checkoutSchema } from '@pharmaos/shared';

export function parseCheckout(input: unknown) {
  const result = checkoutSchema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  return result.data;
}
