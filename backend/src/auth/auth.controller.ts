import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private users: UserService,
    private auth: AuthService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.users.upsertByUsername(dto.username);
    const token = this.auth.signToken(String(user._id), user.username);
    return {
      accessToken: token,
      user: {
        id: String(user._id),
        username: user.username,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  me(@Req() req: any) {
    // req.user: { userId, username } (desde JwtStrategy.validate)
    return req.user;
  }
}
