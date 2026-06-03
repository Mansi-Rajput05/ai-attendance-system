import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-8 max-w-3xl">
      <Badge className="mb-4 border-primary/30 bg-primary/10 text-primary" variant="outline">
        {eyebrow}
      </Badge>
      <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{title}</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
    </div>
  );
}
