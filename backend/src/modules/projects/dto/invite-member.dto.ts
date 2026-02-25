import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  /**
   * Role to assign to the invited user.
   * OWNER cannot be assigned via invite — there is only one owner per project
   * and ownership transfer is a separate (future) feature.
   */
  @IsEnum([Role.ADMIN, Role.MEMBER], {
    message: 'Role must be ADMIN or MEMBER',
  })
  @IsOptional()
  role?: Extract<Role, 'ADMIN' | 'MEMBER'> = Role.MEMBER;
}
