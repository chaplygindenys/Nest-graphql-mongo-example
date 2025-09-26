import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private cfg: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async google() {
    // redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    // req.user is UserDocument from validate()
    const token = this.auth.sign(req.user);
    const frontend = this.cfg.getOrThrow<string>('FRONTEND_URL');
    // Redirect back with token in URL fragment to avoid cookies on GH Pages
    return res.redirect(`${frontend}#token=${token}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  // This route just triggers the redirect to GitHub
  async github() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCb(@Req() req: any, @Res() res: any) {
    const { token } = await this.auth.fromGithubProfile(req.user);
    const frontend = this.cfg.getOrThrow<string>('FRONTEND_URL');
    // choice A: return via fragment
    return res.redirect(`${frontend}#token=${token}`);
    // choice B (more secure): set HttpOnly cookie then redirect
    // res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: true });
    // return res.redirect(frontend);
  }
}
