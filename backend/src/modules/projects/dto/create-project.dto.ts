import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  /**
   * Project key — short uppercase identifier used to prefix ticket numbers.
   * e.g. "MYP" → tickets become MYP-1, MYP-2, MYP-3
   * Must be 2–6 uppercase letters only.
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,6}$/, {
    message: 'Key must be 2–6 uppercase letters only (e.g. MYP, PROJ)',
  })
  key: string;
}
