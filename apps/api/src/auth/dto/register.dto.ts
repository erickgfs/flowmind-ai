import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

// DTO (Data Transfer Object): descreve o formato EXATO que o corpo da
// requisição precisa ter. O ValidationPipe (configurado no main.ts) lê
// estes decorators e rejeita com 400 qualquer corpo que não obedeça.
export class RegisterDto {
  // Normaliza antes de validar: " Ana@Email.com " vira "ana@email.com".
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email deve ser um endereço de e-mail válido' })
  email: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2, { message: 'name deve ter pelo menos 2 caracteres' })
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(8, { message: 'password deve ter pelo menos 8 caracteres' })
  // O bcrypt só considera os primeiros 72 bytes da senha; acima disso
  // o resto seria ignorado silenciosamente — então bloqueamos.
  @MaxLength(72, { message: 'password deve ter no máximo 72 caracteres' })
  password: string;
}
