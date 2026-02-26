import { IsUUID, IsInt, Min, IsNotEmpty } from 'class-validator';

export class MoveTicketDto {
  @IsUUID()
  @IsNotEmpty()
  statusId: string;

  @IsInt()
  @Min(0)
  order: number;
}
