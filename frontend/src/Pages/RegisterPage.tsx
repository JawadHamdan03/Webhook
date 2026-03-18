import { type FormEvent } from 'react'

type RegisterPageProps = {
    confirmPassword: string
    email: string
    error: string | null
    isSubmitting: boolean
    onConfirmPasswordChange: (value: string) => void
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onShowLogin: () => void
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
    password: string
}

export const RegisterPage = ({
    confirmPassword,
    email,
    error,
    isSubmitting,
    onConfirmPasswordChange,
    onEmailChange,
    onPasswordChange,
    onShowLogin,
    onSubmit,
    password
}: RegisterPageProps) => {
    return (
        <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-50">
            <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <section>
                    <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-300">Webhook Platform</p>
                    <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                        Create an operator account and start.
                    </h1>



                </section>

                <section className="rounded-4xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl shadow-black/25">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">Register</p>
                            <h2 className="mt-3 text-3xl font-semibold">Create a new account</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                Use any valid email and a password with at least 6 characters.
                            </p>
                        </div>
                        <button className="text-sm font-medium text-slate-600 underline underline-offset-4" onClick={onShowLogin} type="button">
                            Back to login
                        </button>
                    </div>

                    <form className="mt-8 space-y-5" onSubmit={onSubmit}>
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                            <input
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                                type="email"
                                value={email}
                                onChange={(event) => onEmailChange(event.target.value)}
                                placeholder="you@example.com"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                            <input
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                                type="password"
                                value={password}
                                onChange={(event) => onPasswordChange(event.target.value)}
                                placeholder="At least 6 characters"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Confirm password</span>
                            <input
                                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                                placeholder="Repeat password"
                            />
                        </label>

                        {error ? (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {error}
                            </div>
                        ) : null}

                        <button
                            className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    )
}