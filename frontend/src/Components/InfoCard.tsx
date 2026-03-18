type InfoCardProps = {
    title: string
    value: string
    description: string
}

export const InfoCard = ({ title, value }: InfoCardProps) => {
    return (
        <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">{title}</div>
            <div className="mt-2 text-4xl font-semibold">{value}</div>
        </div>
    )
}