import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageErrorBoundaryProps {
  children: ReactNode;
  title: string;
}

interface PageErrorBoundaryState {
  hasError: boolean;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Page render error in ${this.props.title}:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-left font-heading text-lg text-foreground">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Erro ao carregar {this.props.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Esta tela encontrou um erro inesperado. Atualize a página e tente novamente.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
