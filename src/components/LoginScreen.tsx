import { useState } from 'react';
import { ShieldCheck, LogIn, Chrome, User, Lock, Mail, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { SilLogo } from './SilLogo';
import { setCurrentUser, type PortalUser, type UserRole } from '../utils/authStore';
import { signInWithGoogle, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function LoginScreen({ onLoggedIn }: { onLoggedIn: (u: PortalUser) => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register states
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('agent');

  async function handleGoogleLogin() {
    setBusy(true);
    setError('');
    setSuccessMsg('');
    try {
      const firebaseUser = await signInWithGoogle();
      if (!firebaseUser) throw new Error("Google Login failed");

      // Check if user exists in Firestore
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      let portalUser: PortalUser;

      if (userSnap.exists()) {
        const data = userSnap.data();
        portalUser = {
          id: firebaseUser.uid,
          username: data.username || data.email?.split('@')[0] || 'User',
          name: data.name || firebaseUser.displayName || 'Unknown',
          email: data.email || firebaseUser.email || '',
          role: data.role || 'agent',
          status: data.status || 'active',
          createdAt: data.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
      } else {
        const isAdmin = firebaseUser.email === 'jor.hovhannisyan6@gmail.com';
        portalUser = {
          id: firebaseUser.uid,
          username: firebaseUser.email?.split('@')[0] || 'User',
          name: firebaseUser.displayName || 'Unknown User',
          email: firebaseUser.email || '',
          role: isAdmin ? 'admin' : 'agent',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        await setDoc(userRef, portalUser);
      }

      if (portalUser.status !== 'active') {
        throw new Error("Ձեր հաշիվը ապակտիվացված է կամ սպասում է հաստատման։");
      }

      setCurrentUser(portalUser);
      localStorage.setItem('sil-auth-token', 'firebase-auth-token');
      onLoggedIn(portalUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Սխալ Google-ով մուտք գործելիս');
    } finally {
      setBusy(false);
    }
  }

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Խնդրում ենք լրացնել մուտքանունը և գաղտնաբառը');
      return;
    }

    setBusy(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameOrEmail.trim(),
          password
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Մուտքի սխալ');
      }

      if (data.token) {
        localStorage.setItem('sil-auth-token', data.token);
      }

      const portalUser: PortalUser = {
        id: data.user.id,
        username: data.user.username,
        name: data.user.name,
        email: data.user.email || '',
        role: data.user.role || 'agent',
        status: data.user.status || 'active',
        createdAt: data.user.createdAt || new Date().toISOString(),
        lastLogin: data.user.lastLogin
      };

      setCurrentUser(portalUser);
      onLoggedIn(portalUser);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Սխալ մուտքանուն կամ գաղտնաբառ');
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regPassword) {
      setError('Խնդրում ենք լրացնել բոլոր պարտադիր դաշտերը');
      return;
    }

    setBusy(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          role: regRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Գրանցման սխալ');
      }

      if (data.token && data.user) {
        localStorage.setItem('sil-auth-token', data.token);
        const portalUser: PortalUser = {
          id: data.user.id,
          username: data.user.username,
          name: data.user.name,
          email: data.user.email || '',
          role: data.user.role || 'agent',
          status: data.user.status || 'active',
          createdAt: data.user.createdAt || new Date().toISOString()
        };
        setCurrentUser(portalUser);
        onLoggedIn(portalUser);
      } else {
        setSuccessMsg('Հաշիվը հաջողությամբ ստեղծվեց: Այժմ կարող եք մուտք գործել:');
        setTab('login');
        setUsernameOrEmail(regUsername);
        setPassword('');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Գրանցման սխալ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#061A40] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl overflow-hidden border border-slate-100 transition-all">
        {/* Header */}
        <div className="p-7 bg-gradient-to-br from-[#061A40] via-[#0b2866] to-[#075bd5] text-white relative">
          <div className="flex items-center justify-between">
            <SilLogo size="lg" showSlogan={false} className="brightness-0 invert" />
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-cyan-200 text-[11px] font-bold tracking-wider uppercase border border-white/15">
              <ShieldCheck size={14} className="text-cyan-300" /> SECURE PORTAL
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-4">SIL Insurance</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-0.5">Ապահովագրական գնառաջարկների և underwriting-ի համակարգ</p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              tab === 'login'
                ? 'bg-white text-blue-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn size={16} className={tab === 'login' ? 'text-blue-600' : ''} />
            Մուտք
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
              tab === 'register'
                ? 'bg-white text-blue-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus size={16} className={tab === 'register' ? 'text-blue-600' : ''} />
            Գրանցվել
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Alerts */}
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs sm:text-sm text-rose-800 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle size={17} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 size={17} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign-In Primary Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={busy}
            type="button"
            className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-60 text-slate-800 bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-slate-50 transition shadow-xs text-xs sm:text-sm cursor-pointer"
          >
            <Chrome size={18} className="text-blue-500" />
            {busy ? 'Միանում է...' : 'Մուտք գործել Google-ով'}
          </button>

          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span>Կամ Մուտքանունով</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Login Form */}
          {tab === 'login' ? (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Մուտքանուն կամ Էլ․ հասցե</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="օր․ admin, agent կամ email"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Գաղտնաբառ</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-xs sm:text-sm text-slate-800 font-medium transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-60 shadow-md shadow-blue-500/20 text-xs sm:text-sm cursor-pointer"
              >
                <LogIn size={17} />
                {busy ? 'Ստուգվում է...' : 'Մուտք գործել'}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Անուն, Ազգանուն *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Արմեն Պողոսյան"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 text-xs text-slate-800 font-medium transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Մուտքանուն *</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="armen.p"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 text-xs text-slate-800 font-medium transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Դեր</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 text-xs text-slate-800 font-medium transition"
                  >
                    <option value="agent">Գործակալ</option>
                    <option value="underwriter">Անդերռայթեր</option>
                    <option value="manager">Մենեջեր</option>
                    <option value="admin">Ադմին</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Էլ․ հասցե (ըստ ցանկության)</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="armen@sil.am"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 text-xs text-slate-800 font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Գաղտնաբառ *</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 text-xs text-slate-800 font-medium transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-60 shadow-md text-xs sm:text-sm cursor-pointer mt-2"
              >
                <UserPlus size={16} />
                {busy ? 'Ստեղծվում է...' : 'Ստեղծել հաշիվ'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
