import { BadRequestException } from '@nestjs/common';
import { createSupplierSchema, updateSupplierSchema } from '@pharmaos/shared';

export function parseSupplierInput(input: unknown, partial = false) {
  const result = (partial ? updateSupplierSchema : createSupplierSchema).safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.flatten());
  return result.data;
}
