import { Construction } from "lucide-react";

interface ModulePlaceholderProps {
  title: string;
}

const ModulePlaceholder = ({ title }: ModulePlaceholderProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
      <Construction className="h-16 w-16 mb-4 opacity-40" />
      <h2 className="font-heading text-2xl font-bold mb-2">{title}</h2>
      <p>Este módulo está em desenvolvimento.</p>
    </div>
  );
};

export default ModulePlaceholder;
