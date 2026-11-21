import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto.js';

// PartialType copia TODAS as regras do CreateTaskDto, mas torna cada campo
// opcional. Ideal para PATCH, onde o cliente manda só o que quer mudar.
// (DRY: se a regra do título mudar, muda num lugar só.)
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
