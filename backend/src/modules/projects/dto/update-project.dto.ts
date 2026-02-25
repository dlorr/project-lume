import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * All fields optional for PATCH semantics.
 * Key is intentionally excluded — changing the key would break
 * all existing ticket references (MYP-1 would become something else).
 */
export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
