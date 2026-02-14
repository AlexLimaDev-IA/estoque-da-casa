import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AuthPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Cadastro realizado! Verifique seu email para confirmar.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 w-full max-w-md border border-slate-100 dark:border-slate-700">
                <div className="text-center mb-8">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                        <span className="material-symbols-outlined text-3xl">inventory_2</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Estoque da Casa</h1>
                    <p className="text-slate-500 font-medium text-sm">Gerencie sua despensa de forma inteligente</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${mode === 'login'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Entrar
                    </button>
                    <button
                        onClick={() => setMode('signup')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${mode === 'signup'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Criar Conta
                    </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white font-medium placeholder:text-slate-400"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white font-medium placeholder:text-slate-400"
                            placeholder="Sua senha secreta"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 animate-in fade-in slide-in-from-top-1">
                            <span className="material-symbols-outlined text-lg">error</span>
                            <span className="text-xs font-bold">{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : mode === 'login' ? (
                            <>
                                <span>Entrar</span>
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </>
                        ) : (
                            <>
                                <span>Criar Conta</span>
                                <span className="material-symbols-outlined text-lg">person_add</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
