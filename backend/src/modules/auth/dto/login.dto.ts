import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for login — intentionally minimal.
 * We don't give hints about WHICH field is wrong (email vs password)
 * to prevent user enumeration attacks. The error message in the service
 * should always be generic: "Invalid credentials".
 */
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
