import { IsEmail, IsString, MinLength } from 'class-validator';
export class RegisterDto { @IsString() firstName!: string; @IsString() lastName!: string; @IsString() pharmacy!: string; @IsString() country!: string; @IsString() city!: string; @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; }
export class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }
