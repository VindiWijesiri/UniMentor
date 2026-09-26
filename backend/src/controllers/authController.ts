import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { isUserRole } from '../types/roles';

function signToken(id: string, role: string): string {
  const secret = process.env.JWT_SECRET ?? 'changeme';
  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'Name, email, password and role are required.' });
      return;
    }
    if (!isUserRole(role)) {
      res.status(400).json({ message: 'Role must be student, mentor, lic or admin.' });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email is already registered.' });
      return;
    }

    const user = await User.create({ name, email, password, role });
    const token = signToken(String(user._id), user.role);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = signToken(String(user._id), user.role);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
