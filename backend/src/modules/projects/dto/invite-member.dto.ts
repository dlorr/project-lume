import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum([Role.ADMIN, Role.MEMBER], {
    message: 'Role must be ADMIN or MEMBER',
  })
  @IsOptional()
  role?: Extract<Role, 'ADMIN' | 'MEMBER'> = Role.MEMBER;
}
