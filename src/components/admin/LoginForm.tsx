import { useState } from 'react';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/redactingpages/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Ошибка входа');
        return;
      }
      window.location.href = '/redactingpages';
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex min-h-screen max-w-[360px] flex-col justify-center px-6"
    >
      <h1 className="mb-8 text-[42px] lowercase leading-none">вход</h1>
      <label className="mb-2 text-[15px] lowercase opacity-60">пароль</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4 border-0 border-b border-black bg-transparent px-0 py-2 text-[15px] outline-none"
        autoFocus
      />
      {error ? <p className="mb-4 text-[14px] text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="bg-yy-yellow px-6 py-3 text-[15px] lowercase disabled:opacity-50"
      >
        {loading ? '...' : 'войти'}
      </button>
    </form>
  );
}
