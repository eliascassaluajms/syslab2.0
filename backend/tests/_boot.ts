process.env.DATABASE_URL = 'postgresql://admin_syslab:SecretPassword2026@127.0.0.1:5434/syslab_db?schema=public';
const { default: app } = await import('../src/app.ts');
const server = app.listen(5999, () => console.error('>>> LISTO 5999'));
