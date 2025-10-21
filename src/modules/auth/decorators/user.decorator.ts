import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator to extract the authenticated user object
 * (set by Passport in req.user) and inject it directly into your controller methods.
 *
 * Usage:
 *   @Get('me')
 *   getMe(@User() user: UserEntity) {
 *     return user;
 *   }
 */

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    // Step 1️⃣: Access the underlying HTTP context
    const request = ctx.switchToHttp().getRequest();
    // Step 2️⃣: Return `request.user`, which Passport placed there
    // after a successful JWT guard authentication.
    // The `data` parameter can optionally pick a specific property,
    // e.g. `@User('email')` to return only the email field.
    // return data ? request.user?.[data] : request.user;
    return request.user;
});
