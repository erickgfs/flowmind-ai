import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthResponse, JwtPayload } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

// "Custo" do bcrypt: 10 = 2^10 rodadas de hash. Quanto maior, mais lento
// (e mais caro para um atacante testar senhas). 10–12 é o usual em produção.
export const BCRYPT_SALT_ROUNDS = 10;

// Hash de uma senha qualquer, usado quando o e-mail NÃO existe no login.
// Assim o tempo de resposta é parecido nos dois casos e um atacante não
// descobre quais e-mails estão cadastrados medindo a demora (timing attack).
const DUMMY_HASH =
  '$2b$10$dK61lhoXGB.AqV5sGME35uD5Rjx/8tbShqsdMHokuPJLAp9OXObNa';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    // Nunca guardamos a senha em si — só o hash (impressão digital irreversível).
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash },
    });

    return this.buildResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // bcrypt.compare refaz o hash da senha digitada (com o mesmo "sal"
    // embutido no hash salvo) e compara os resultados.
    const passwordOk = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    // Mesma mensagem para "e-mail não existe" e "senha errada":
    // não damos pistas a quem está tentando adivinhar contas.
    if (!user || !passwordOk) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.buildResponse(user);
  }

  private async buildResponse(user: {
    id: string;
    email: string;
    name: string;
  }): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    // signAsync assina o payload com o JWT_SECRET (configurado no AuthModule).
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
