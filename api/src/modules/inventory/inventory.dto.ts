import { BadRequestException } from '@nestjs/common';
import { createStockMovementSchema } from '@pharmaos/shared';

export function parseStockMovement(input: unknown) {
  const result = createStockMovementSchema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  return result.data;
}
