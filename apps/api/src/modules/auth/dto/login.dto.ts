import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'maya@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'hunter2' })
  @IsNotEmpty()
  password!: string;
}
