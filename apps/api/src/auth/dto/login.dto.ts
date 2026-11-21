import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email deve ser um endereço de e-mail válido' })
  email: string;

  // No login não repetimos as regras de força da senha: só exigimos que
  // venha algo. Quem decide se está certa é o bcrypt.compare no service.
  @IsString()
  @MinLength(1, { message: 'password é obrigatório' })
  password: string;
}
