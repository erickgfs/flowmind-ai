import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../../generated/prisma/enums.js';

// Repare que NÃO existe `userId` aqui: o dono da tarefa vem do token JWT,
// nunca do corpo da requisição (senão alguém criaria tarefas em nome de outro).
// Como o ValidationPipe usa `whitelist`, um `userId` enviado seria rejeitado.
export class CreateTaskDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'title é obrigatório' })
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  // IsEnum garante que só aceitamos os valores definidos no schema.prisma.
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `status deve ser um de: ${Object.values(TaskStatus).join(', ')}`,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, {
    message: `priority deve ser um de: ${Object.values(TaskPriority).join(', ')}`,
  })
  priority?: TaskPriority;

  // Data no formato ISO 8601, ex.: "2026-12-31" ou "2026-12-31T18:00:00Z".
  @IsOptional()
  @IsDateString({}, { message: 'dueDate deve ser uma data ISO 8601' })
  dueDate?: string;
}
