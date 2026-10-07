import { authRepository } from '../../../data/repositories/authRepository';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'mentor';
}

export async function registerUseCase(input: RegisterInput) {
  const { name, email, password, role } = input;
  if (!name || !email || !password) throw new Error('All fields are required.');
  return authRepository.register({ name, email, password, role });
}
