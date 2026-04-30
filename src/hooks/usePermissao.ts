import { useAuthContext } from "@/contexts/AuthContext";

function makeKey(modulo: string, pagina: string) {
  return `${modulo}::${pagina}`;
}

export function usePermissao(modulo: string, pagina: string) {
  const { profile } = useAuthContext();

  if (profile?.super_admin) {
    return {
      acesso: true,
      visualizacao: true,
      criacao: true,
      edicao: true,
      exclusao: true,
    };
  }

  const key = makeKey(modulo, pagina);
  const perms = profile?.permissoes?.[key] ?? {};

  return {
    acesso: perms["acesso"] ?? false,
    visualizacao: perms["visualizacao"] ?? false,
    criacao: perms["criacao"] ?? false,
    edicao: perms["edicao"] ?? false,
    exclusao: perms["exclusao"] ?? false,
  };
}

export function useTemAcesso(modulo: string, pagina: string): boolean {
  const { acesso } = usePermissao(modulo, pagina);
  return acesso;
}
