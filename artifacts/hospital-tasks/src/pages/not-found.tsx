import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight mb-2">404 - Setor Não Encontrado</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-md">
        Parece que você se perdeu nos corredores. A página que você está procurando não existe na triagem.
      </p>
      <Button size="lg" className="h-12 px-8 text-lg" onClick={() => navigate("/")}>
        Voltar ao Painel
      </Button>
    </div>
  );
}
