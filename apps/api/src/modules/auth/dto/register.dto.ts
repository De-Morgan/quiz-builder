import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'maya@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    minLength: 6,
    example: 'hunter2',
    description: 'password must be longer than or equal to 6 characters',
  })
  @MinLength(6)
  password!: string;
}
