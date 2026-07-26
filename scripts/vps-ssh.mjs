import { Client } from 'ssh2';

const host = process.env.VPS_HOST || '157.22.197.35';
const username = process.env.VPS_USER || 'root';
const password = process.env.VPS_PASSWORD;
const command = process.argv.slice(2).join(' ');

if (!password) {
  console.error('VPS_PASSWORD required');
  process.exit(1);
}
if (!command) {
  console.error('Usage: node scripts/vps-ssh.mjs <remote command>');
  process.exit(1);
}

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(command, (err, stream) => {
      if (err) {
        console.error(err);
        conn.end();
        process.exit(1);
      }
      let code = 0;
      stream
        .on('close', (exitCode) => {
          conn.end();
          process.exit(exitCode ?? code);
        })
        .on('data', (d) => process.stdout.write(d))
        .stderr.on('data', (d) => process.stderr.write(d));
      stream.on('exit', (c) => {
        code = c ?? 0;
      });
    });
  })
  .on('error', (err) => {
    console.error(err.message);
    process.exit(1);
  })
  .connect({
    host,
    port: 22,
    username,
    password,
    readyTimeout: 20000,
  });
