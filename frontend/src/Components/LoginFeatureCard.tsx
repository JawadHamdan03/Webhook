type LoginFeatureCardProps = {
    title: string
    value: string
    description: string
}

export const LoginFeatureCard = ({ title, value, description }: LoginFeatureCardProps) => {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-medium text-slate-200">{title}</div>
            <div className="mt-2 text-2xl font-semibold">{value}</div>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
        </div>
    )
}