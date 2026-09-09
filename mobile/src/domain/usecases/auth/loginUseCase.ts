import { authRepository } from '@data/repositories/authRepository';

interface LoginInput {
  email: string;
  password: string;
}

export async function loginUseCase(input: LoginInput) {
  const { email, password } = input;

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  return authRepository.login(email, password);
}
