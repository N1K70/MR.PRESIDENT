import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'missing fields' });
  const exists = await query('select 1 from users where email=$1 limit 1', [email]);
  if (exists.rows.length) return res.status(409).json({ error: 'email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const inserted = await query<{ id:string }>('insert into users(name,email,password_hash) values($1,$2,$3) returning id', [name, email, hash]);
  const userId = inserted.rows[0].id;
  const token = jwt.sign({ sub: userId, email }, process.env.JWT_SECRET || 'dev', { algorithm: 'HS256' });
  res.json({ token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'missing fields' });
  const resUser = await query<{ id:string, password_hash:string }>('select id, password_hash from users where email=$1 limit 1', [email]);
  if (!resUser.rows.length) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, resUser.rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ sub: resUser.rows[0].id, email }, process.env.JWT_SECRET || 'dev', { algorithm: 'HS256' });
  res.json({ token });
});

export default router;
