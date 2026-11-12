import { BadRequestException } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { changePasswordSchema } from '@pharmaos/shared';
export class RegisterDto { @IsString() firstName!: string; @IsString() lastName!: string; @IsString() pharmacy!: string; @IsString() country!: string; @IsString() city!: string; @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; }
export class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }
export class ChangePasswordDto {
  currentPassword!: string;
  newPassword!: string;
  static validate(input: unknown) {
    const result = changePasswordSchema.safeParse(input);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    return result.data;
  }
}
