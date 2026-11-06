import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
export class CreateUserDto { @IsString() firstName!: string; @IsString() lastName!: string; @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; @IsIn(['MANAGER', 'CASHIER']) role!: 'MANAGER' | 'CASHIER'; }
