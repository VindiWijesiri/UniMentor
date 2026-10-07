import { campusRepository } from '../../../data/repositories/campusRepository';
import type { RegisterCampusInput } from '../../entities/Campus';

export async function registerCampusUseCase(input: RegisterCampusInput) {
  if (!input.name.trim() || !input.shortCode.trim() || !input.city.trim()) {
    throw new Error('Campus name, code, and city are required.');
  }
  if (!input.adminName.trim() || !input.adminEmail.trim() || !input.adminPassword) {
    throw new Error('Campus admin name, email, and password are required.');
  }
  if (input.adminPassword.length < 6) {
    throw new Error('Admin password must be at least 6 characters.');
  }
  return campusRepository.register({
    ...input,
    name: input.name.trim(),
    shortCode: input.shortCode.trim().toUpperCase(),
    city: input.city.trim(),
    country: input.country.trim() || 'Sri Lanka',
    adminName: input.adminName.trim(),
    adminEmail: input.adminEmail.trim().toLowerCase(),
  });
}
