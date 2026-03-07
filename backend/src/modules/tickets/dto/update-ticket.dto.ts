import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { TicketPriority, TicketType } from 'src/generated/prisma/enums';

export class UpdateTicketDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value ?? null)
  description?: string;

  @IsEnum(TicketType)
  @IsOptional()
  type?: TicketType;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsUUID()
  @IsOptional()
  @Transform(({ value }) => value ?? null)
  assigneeId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
