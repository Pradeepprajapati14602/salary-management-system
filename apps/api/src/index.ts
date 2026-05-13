import 'dotenv/config';
import { disconnectPrismaClient } from './db/connection.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 3001);

const app = createApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.info(`API listening on http://localhost:${port}`);
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    void disconnectPrismaClient();
  });
}
