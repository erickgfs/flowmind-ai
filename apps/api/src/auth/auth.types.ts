// Conteúdo que guardamos DENTRO do token JWT ("payload").
// `sub` (subject) é o nome padrão da especificação JWT para "de quem é o token".
export interface JwtPayload {
  sub: string;
  email: string;
}

// Usuário autenticado que o AuthGuard pendura em `request.user`.
export interface AuthUser {
  id: string;
  email: string;
}

// Resposta de /auth/register e /auth/login. Repare: NUNCA inclui passwordHash.
export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
