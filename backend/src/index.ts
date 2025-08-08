import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import auth from './routes/auth';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_: Request, res: Response)=> res.json({ ok: true }));
app.use('/auth', auth);

const port = Number(process.env.PORT || 4000);
app.listen(port, ()=> console.log(`API running on http://localhost:${port}`));
