import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';

@Module({
  // Importa o AuthModule para ter acesso ao AuthGuard (e ao JwtService que ele usa).
  imports: [AuthModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
