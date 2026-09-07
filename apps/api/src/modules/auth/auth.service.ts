import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../services/hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-res.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}

  async register({ email, password }: RegisterDto): Promise<AuthResponseDto> {
    const normalizedEmail = this.normalizeEmail(email);
    const existing = await this.databaseService.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await this.hashingService.hash(password);
    const user = await this.databaseService.user.create({
      data: { email: normalizedEmail, passwordHash },
    });
    return this.buildAuthResponse(user);
  }

  async login({ email, password }: LoginDto): Promise<AuthResponseDto> {
    const user = await this.databaseService.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });

    if (
      !user ||
      !(await this.hashingService.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(user);
  }

  async me(id: string): Promise<UserDto> {
    return await this.getUserById(id);
  }

  async getUserById(id: string): Promise<UserDto> {
    const user = await this.databaseService.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toSafeUser(user);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private buildAuthResponse({
    id,
    email,
  }: {
    id: string;
    email: string;
  }): AuthResponseDto {
    const accessToken = this.jwtService.sign({
      sub: id,
      email,
    });
    return { accessToken, user: { id, email } };
  }

  private toSafeUser(user: { id: string; email: string }): UserDto {
    return { id: user.id, email: user.email };
  }
}
