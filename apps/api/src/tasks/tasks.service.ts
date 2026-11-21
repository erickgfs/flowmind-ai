import { Injectable, NotFoundException } from '@nestjs/common';
import type { Task } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

// Toda operação recebe o `userId` de quem está logado: um usuário
// só enxerga e mexe nas PRÓPRIAS tarefas.
@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({
      data: { ...this.toData(dto), title: dto.title, userId },
    });
  }

  findAll(userId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Task> {
    // Filtrar por id E userId: se a tarefa existe mas é de outra pessoa,
    // respondemos 404 (e não 403) para nem revelar que ela existe.
    const task = await this.prisma.task.findFirst({ where: { id, userId } });
    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }
    return task;
  }

  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    await this.findOne(userId, id); // garante que existe e é do usuário
    return this.prisma.task.update({
      where: { id },
      data: this.toData(dto),
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);
    await this.prisma.task.delete({ where: { id } });
  }

  // Converte o DTO (classe) num objeto simples para o Prisma, campo a campo.
  // Listar os campos explicitamente evita repassar ao banco algo inesperado.
  private toData(dto: UpdateTaskDto) {
    return {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      dueDate: this.toDueDate(dto.dueDate),
    };
  }

  // Três casos diferentes para o Prisma:
  //   undefined -> campo não enviado: não mexe no prazo
  //   null      -> "sem prazo": grava NULL no banco
  //   "2026-..."-> novo prazo
  private toDueDate(value: string | null | undefined): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return new Date(value);
  }
}
