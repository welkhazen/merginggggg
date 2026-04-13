import bcrypt from "bcryptjs";
import { env } from "../config/env";

const PASSWORD_PEPPER = env.AUTH_PASSWORD_PEPPER;
const BCRYPT_ROUNDS = env.BCRYPT_ROUNDS;

export async function hashPassword(rawPassword: string): Promise<string> {
  return bcrypt.hash(`${rawPassword}${PASSWORD_PEPPER}`, BCRYPT_ROUNDS);
}

export async function verifyPassword(rawPassword: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(`${rawPassword}${PASSWORD_PEPPER}`, storedHash);
}
