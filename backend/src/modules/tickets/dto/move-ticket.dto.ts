import { IsUUID, IsInt, Min, IsNotEmpty } from 'class-validator';

/**
 * MoveTicketDto handles drag-and-drop card movement.
 *
 * statusId  → which column to move to (can be same column for reorder)
 * order     → new position index within the target column
 *
 * The frontend sends both values after the user drops a card.
 * The service recalculates all affected order values to keep them consistent.
 */
export class MoveTicketDto {
  @IsUUID()
  @IsNotEmpty()
  statusId: string;

  @IsInt()
  @Min(0)
  order: number;
}
