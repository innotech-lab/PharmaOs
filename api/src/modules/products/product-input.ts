import { BadRequestException } from '@nestjs/common';
import { createProductSchema, updateProductSchema } from '@pharmaos/shared';

export function parseProductInput(input: unknown, partial = false) {
  const result = (partial ? updateProductSchema : createProductSchema).safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  return result.data;
}
