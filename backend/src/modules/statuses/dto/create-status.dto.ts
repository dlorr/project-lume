import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateStatusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  // Validate hex color format: #FFF or #FFFFFF
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex color (e.g. #3B82F6)',
  })
  color?: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
