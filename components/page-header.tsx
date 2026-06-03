import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-8 max-w-3xl">
      <Badge className="mb-4" variant="outline">
        {eyebrow}
      </Badge>
      <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">{title}</h1>
      <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400 sm:text-lg">{description}</p>
    </div>
  );
}
