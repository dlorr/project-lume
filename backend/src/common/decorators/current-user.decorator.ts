import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser() decorator extracts the authenticated user from the request.
 *
 * After JwtAuthGuard runs, the validated user object is attached to request.user
 * by the JwtAccessStrategy.validate() method.
 *
 * This decorator is just a clean shortcut — instead of:
 *   @Req() req: Request  then  req.user
 *
 * You write:
 *   @CurrentUser() user: SafeUser
 *
 * Usage:
 *   @Get('me')
 *   @UseGuards(JwtAuthGuard)
 *   getMe(@CurrentUser() user: SafeUser) {
 *     return user;
 *   }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
