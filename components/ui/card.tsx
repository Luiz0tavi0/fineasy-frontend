// components/ui/card.tsx
import { cn } from "@/lib/utils";

type CardProps = {
    title?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
};

export function Card({ title, action, children, className }: CardProps) {
    return (
        <div className={cn("rounded-xl border bg-white p-4 shadow-sm", className)}>
            {(title || action) && (
                <div className="mb-3 flex items-center justify-between gap-2">
                    {title && <h3 className="text-sm font-medium text-zinc-500">{title}</h3>}
                    {action}
                </div>
            )}
            {children}
        </div>
    );
}