import * as XLSX from "xlsx";
import { capitalizeName } from "@/utils/formatName";
import { formatCPF, isValidCPF } from "@/utils/cpf";
import { supabase } from "@/integrations/supabase/client";

export const COLUNAS_MODELO = [
  "Nome Completo",
  "CPF",
  "Data de Nascimento",
  "Sexo",
  "Telefone",
  "Cargo / Função",
  "Centro de Custo",
  "Contrato",
  "Site",
  "Data de Admissão",
  "Status do Colaborador",
  "CEP",
  "Número",
  "Complemento",
  "Banco",
  "Agência",
  "Dígito da Agência",
  "Conta",
  "Dígito da Conta",
];

export function downloadModelo() {
  const ws = XLSX.utils.aoa_to_sheet([COLUNAS_MODELO]);
  // Set column widths
  ws["!cols"] = COLUNAS_MODELO.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Modelo");
  XLSX.writeFile(wb, "modelo_importacao_colaboradores.xlsx");
}

export interface ImportRow {
  linha: number;
  dados: Record<string, string>;
  erros: string[];
  valido: boolean;
}

function str(val: unknown): string {
  if (val == null) return "";
  return String(val).trim();
}

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(val).trim();
  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  // yyyy-mm-dd
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
}

export function parseExcelFile(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

        const result: ImportRow[] = rows.map((row, idx) => {
          const erros: string[] = [];
          const nome = str(row["Nome Completo"]);
          const cpfRaw = str(row["CPF"]);
          const dataNasc = parseDate(row["Data de Nascimento"]);
          const sexo = str(row["Sexo"]);
          const telefone = str(row["Telefone"]);
          const email = str(row["Email"]);
          const cargo = str(row["Cargo / Função"]);
          const centroCusto = str(row["Centro de Custo"]);
          const contrato = str(row["Contrato"]);
          const site = str(row["Site"]);
          const dataAdm = parseDate(row["Data de Admissão"]);
          const status = str(row["Status do Colaborador"]) || "Ativo";

          // Validations
          if (!nome) erros.push("Nome Completo obrigatório");
          if (!cpfRaw) erros.push("CPF obrigatório");
          else if (!isValidCPF(cpfRaw)) erros.push("CPF inválido");
          if (!sexo) erros.push("Sexo obrigatório");
          if (!dataNasc) erros.push("Data de Nascimento inválida ou ausente");
          if (!cargo) erros.push("Cargo / Função obrigatório");
          if (!contrato) erros.push("Contrato obrigatório");
          if (!site) erros.push("Site obrigatório");
          if (!["Ativo", "Inativo", "Afastado", "Desligado"].includes(status))
            erros.push("Status inválido (use: Ativo, Inativo, Afastado ou Desligado)");

          return {
            linha: idx + 2, // +2 because header is row 1
            erros,
            valido: erros.length === 0,
            dados: {
              nome: capitalizeName(nome),
              cpf: cpfRaw ? formatCPF(cpfRaw.replace(/\D/g, "")) : "",
              data_nascimento: dataNasc || "",
              sexo,
              telefone,
              email,
              cargo: capitalizeName(cargo),
              centro_custo: centroCusto,
              contrato,
              site_contrato: site,
              data_admissao: dataAdm || new Date().toISOString().slice(0, 10),
              status,
              cep: str(row["CEP"]),
              logradouro: str(row["Logradouro"]),
              numero: str(row["Número"]),
              complemento: str(row["Complemento"]),
              bairro: str(row["Bairro"]),
              cidade: str(row["Cidade"]),
              estado: str(row["Estado"]),
              banco: str(row["Banco"]),
              agencia: str(row["Agência"]),
              digito_agencia: str(row["Dígito da Agência"]),
              conta: str(row["Conta"]),
              digito_conta: str(row["Dígito da Conta"]),
            },
          };
        });
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsArrayBuffer(file);
  });
}

export async function insertColaboradores(rows: ImportRow[]) {
  const validos = rows.filter((r) => r.valido);
  if (validos.length === 0) return { inserted: 0 };

  const records = validos.map((r) => ({
    nome: r.dados.nome,
    cpf: r.dados.cpf || null,
    data_nascimento: r.dados.data_nascimento || null,
    sexo: r.dados.sexo || null,
    telefone: r.dados.telefone || null,
    email: r.dados.email || null,
    cargo: r.dados.cargo,
    centro_custo: r.dados.centro_custo,
    contrato: r.dados.contrato || null,
    site_contrato: r.dados.site_contrato,
    data_admissao: r.dados.data_admissao,
    status: r.dados.status,
    cep: r.dados.cep || null,
    logradouro: r.dados.logradouro || null,
    numero: r.dados.numero || null,
    complemento: r.dados.complemento || null,
    bairro: r.dados.bairro || null,
    cidade: r.dados.cidade || null,
    estado: r.dados.estado || null,
    banco: r.dados.banco || null,
    agencia: r.dados.agencia || null,
    digito_agencia: r.dados.digito_agencia || null,
    conta: r.dados.conta || null,
    digito_conta: r.dados.digito_conta || null,
  }));

  const { error } = await supabase.from("colaboradores").insert(records as any);
  if (error) throw error;
  return { inserted: records.length };
}

export interface ColaboradorExport {
  nome: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  sexo?: string | null;
  telefone?: string | null;
  email?: string | null;
  cargo: string;
  centro_custo: string;
  contrato?: string | null;
  site_contrato: string;
  data_admissao: string;
  status: string;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  banco?: string | null;
  agencia?: string | null;
  digito_agencia?: string | null;
  conta?: string | null;
  digito_conta?: string | null;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("pt-BR");
  } catch {
    return d;
  }
}

export function exportColaboradores(colaboradores: ColaboradorExport[]) {
  const data = colaboradores.map((c) => ({
    "Nome Completo": c.nome,
    "CPF": c.cpf || "",
    "Data de Nascimento": fmtDate(c.data_nascimento),
    "Sexo": c.sexo || "",
    "Telefone": c.telefone || "",
    "Email": (c as any).email || "",
    "Cargo / Função": c.cargo,
    "Centro de Custo": c.centro_custo,
    "Contrato": (c as any).contrato || "",
    "Site": c.site_contrato,
    "Data de Admissão": fmtDate(c.data_admissao),
    "Status do Colaborador": c.status,
    "CEP": (c as any).cep || "",
    "Logradouro": (c as any).logradouro || "",
    "Número": (c as any).numero || "",
    "Complemento": (c as any).complemento || "",
    "Bairro": (c as any).bairro || "",
    "Cidade": (c as any).cidade || "",
    "Estado": (c as any).estado || "",
    "Banco": (c as any).banco || "",
    "Agência": (c as any).agencia || "",
    "Dígito da Agência": (c as any).digito_agencia || "",
    "Conta": (c as any).conta || "",
    "Dígito da Conta": (c as any).digito_conta || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = COLUNAS_MODELO.map((h) => ({ wch: Math.max(h.length + 4, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
  XLSX.writeFile(wb, "colaboradores_efetivo.xlsx");
}
