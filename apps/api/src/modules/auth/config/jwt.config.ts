import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class JwtEnv {
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsInt()
  @Min(1)
  JWT_EXPIRES_IN!: number;

  @IsOptional()
  @IsString()
  JWT_TOKEN_AUDIENCE?: string;

  @IsOptional()
  @IsString()
  JWT_TOKEN_ISSUER?: string;
}

export default registerAs('jwt', () => {
  const validated = plainToInstance(
    JwtEnv,
    {
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRES_IN: Number(process.env.JWT_EXPIRES_IN ?? '3600'),
      JWT_TOKEN_AUDIENCE: process.env.JWT_TOKEN_AUDIENCE,
      JWT_TOKEN_ISSUER: process.env.JWT_TOKEN_ISSUER,
    },
    { enableImplicitConversion: true },
  );

  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n');
    throw new Error(`Invalid JWT config:\n${details}`);
  }

  return {
    secret: validated.JWT_SECRET,
    audience: validated.JWT_TOKEN_AUDIENCE,
    issuer: validated.JWT_TOKEN_ISSUER,
    expiresIn: validated.JWT_EXPIRES_IN,
  };
});
