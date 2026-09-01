import { useState, type FormEvent } from 'react';
import { UserPlus, ShieldCheck, LogIn, KeyRound } from 'lucide-react';
import { SilLogo } from './SilLogo';
import { setCurrentUser, type PortalUser } from '../utils/authStore';

export function LoginScreen({ onLoggedIn }: { onLoggedIn: (u: PortalUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('Admin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'login'
            ? { username, password }
            : { username, password, name, email }
        ),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Գործողությունը չհաջողվեց');
      if (mode === 'login') {
        setCurrentUser(data.user);
        localStorage.setItem('sil-auth-token', data.token);
        onLoggedIn(data.user);
      } else {
        setMode('login');
        setError('Գրանցումը ընդունվեց։ Սպասեք Admin/Manager-ի հաստատմանը։');
      }
    } catch (err: any) {
      setError(err.message || 'Սխալ');
    } finally {
      setBusy(false);
    }
  }

  const fillAdmin = () => {
    setUsername('Admin');
    setPassword('Admin');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#061A40] flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8 bg-gradient-to-br from-[#061A40] to-[#075bd5] text-white">
          <SilLogo size="lg" showSlogan={false} className="brightness-0 invert" />
          <div className="mt-6 flex items-center gap-2 text-cyan-200 text-xs font-black tracking-[.18em]">
            <ShieldCheck size={16} /> SECURE INSURANCE PORTAL
          </div>
          <h1 className="text-2xl font-black mt-2">SIL Insurance</h1>
          <p className="text-sm text-blue-100 mt-1">Ներքին գնառաջարկի և underwriting հարթակ</p>
        </div>

        <form onSubmit={submit} className="p-8 space-y-4">
          {mode === 'register' && (
            <>
              <Field label="Անուն Ազգանուն" value={name} onChange={setName} />
              <Field label="Email" value={email} onChange={setEmail} type="email" />
            </>
          )}

          <Field label="Username" value={username} onChange={setUsername} />
          <Field label="Password" value={password} onChange={setPassword} type="password" />

          <button
            disabled={busy}
            type="submit"
            className="w-full sil-primary py-3.5 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-60 text-white bg-[#0066FF] hover:bg-[#0052CC] transition shadow-md"
          >
            {mode === 'login' ? <LogIn size={17} /> : <UserPlus size={17} />}
            {busy ? 'Մուտք...' : mode === 'login' ? 'Մուտք գործել' : 'Գրանցվել'}
          </button>

          {error && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="w-full text-sm font-bold text-[#075bd5] pt-1"
          >
            {mode === 'login' ? 'Նոր օգտատե՞ր եք — գրանցվել' : 'Արդեն ունե՞ք account — մուտք գործել'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      <span className="mb-1 block">{label}</span>
      <input
        required
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium transition"
      />
    </label>
  );
}
