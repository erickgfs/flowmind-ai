import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';

// Teste UNITÁRIO: testamos só o AuthService, isolado do mundo.
// O banco (Prisma) e o JWT viram "dublês" (mocks) — funções falsas cujo
// retorno nós controlamos. Assim o teste não precisa de Postgres rodando.
// (A API `vi.fn()` do Vitest é a mesma ideia do `jest.fn()` do Jest.)
describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  const jwtMock = {
    signAsync: vi.fn().mockResolvedValue('token-falso'),
  };

  beforeEach(async () => {
    vi.clearAllMocks(); // zera chamadas/retornos de um teste para o outro
    jwtMock.signAsync.mockResolvedValue('token-falso');

    // Monta um "mini Nest" só com o AuthService, trocando as dependências
    // reais pelos mocks (useValue).
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    const dto = {
      email: 'ana@flowmind.dev',
      name: 'Ana',
      password: 'senha-forte-123',
    };

    it('salva o HASH da senha (nunca a senha pura) e devolve um token', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // e-mail livre
      prismaMock.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'user-1', ...data }),
      );

      const result = await service.register(dto);

      const saved = prismaMock.user.create.mock.calls[0][0].data;
      expect(saved.passwordHash).not.toBe(dto.password);
      expect(await bcrypt.compare(dto.password, saved.passwordHash)).toBe(true);

      expect(jwtMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: dto.email,
      });
      expect(result).toEqual({
        accessToken: 'token-falso',
        user: { id: 'user-1', email: dto.email, name: 'Ana' },
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('lança ConflictException (409) se o e-mail já existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existente' });

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const password = 'senha-forte-123';
    let storedUser: {
      id: string;
      email: string;
      name: string;
      passwordHash: string;
    };

    beforeAll(async () => {
      // Hash real com custo baixo (4) só para o teste ficar rápido.
      storedUser = {
        id: 'user-1',
        email: 'ana@flowmind.dev',
        name: 'Ana',
        passwordHash: await bcrypt.hash(password, 4),
      };
    });

    it('devolve token quando e-mail e senha estão corretos', async () => {
      prismaMock.user.findUnique.mockResolvedValue(storedUser);

      const result = await service.login({ email: storedUser.email, password });

      expect(result.accessToken).toBe('token-falso');
      expect(result.user).toEqual({
        id: 'user-1',
        email: storedUser.email,
        name: 'Ana',
      });
    });

    it('lança UnauthorizedException (401) com senha errada', async () => {
      prismaMock.user.findUnique.mockResolvedValue(storedUser);

      await expect(
        service.login({ email: storedUser.email, password: 'senha-errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });

    it('lança UnauthorizedException (401) com a MESMA mensagem se o e-mail não existe', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ninguem@flowmind.dev', password }),
      ).rejects.toThrow('Credenciais inválidas');
    });
  });
});
