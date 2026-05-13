import { disconnectPrismaClient } from '../connection.js';
import { runSeed } from './seed.js';

await runSeed();
await disconnectPrismaClient();
