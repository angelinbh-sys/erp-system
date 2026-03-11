import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, X, Search } from "lucide-react";
import { useCreateVaga, type VagaInsert } from "@/hooks/useVagas";
import { useCreateNotificacao } from "@/hooks/useNotificacoes";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { useCentrosCusto, useCargos } from "@/hooks/useCadastros";
import { cidadesBrasil, getCidadeLabel } from "@/data/cidadesBrasil";
import { formatCurrencyBRL } from "@/utils/currency";
import { formatPhone } from "@/utils/phone";

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const vagaSchema = z.object({
  cargo: z.string().min(1, "Cargo / Função é obrigatório"),
  salario: z.string().min(1, "Salário é obrigatório"),
  centroCusto: z.string().min(1, "Centro de Custo é obrigatório"),
  localTrabalho: z.string().min(1, "Local de trabalho é obrigatório"),
  tipoContrato: z.string().min(1, "Site / Contrato é obrigatório"),
  nomeCandidato: z.string().min(1, "Nome do Candidato é obrigatório").max(200),
  dataNascimento: z.string().min(1, "Data de Nascimento é obrigatória"),
  telefone: z.string().min(14, "Telefone de Contato é obrigatório"),
});

type VagaForm = z.infer<typeof vagaSchema>;

interface BeneficiosState {
  va: boolean;
  vaValor: string;
  auxilioMoradia: boolean;
  auxilioMoradiaValor: string;
  assiduidade: boolean;
  assiduidadeValor: string;
  ajudaCusto: boolean;
  ajudaCustoValor: string;
  planoSaude: boolean;
  planoOdontologico: boolean;
}

const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const AberturaDeVaga = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [docError, setDocError] = useState("");
  const [cidadeOpen, setCidadeOpen] = useState(false);
  const defaultBeneficios: BeneficiosState = {
    va: false, vaValor: "",
    auxilioMoradia: false, auxilioMoradiaValor: "",
    assiduidade: false, assiduidadeValor: "",
    ajudaCusto: false, ajudaCustoValor: "",
    planoSaude: false,
    planoOdontologico: false,
  };
  const [beneficios, setBeneficios] = useState<BeneficiosState>(defaultBeneficios);

  const { items: cargos } = useCargos();
  const { items: centrosCusto } = useCentrosCusto();
  const createVaga = useCreateVaga();
  const createNotificacao = useCreateNotificacao();
  const { logAction } = useAuditLog();

  const form = useForm<VagaForm>({
    resolver: zodResolver(vagaSchema),
    defaultValues: {
      cargo: "",
      salario: "",
      centroCusto: "",
      localTrabalho: "",
      tipoContrato: "",
      nomeCandidato: "",
      dataNascimento: "",
      telefone: "",
    },
  });

  const selectedCCId = form.watch("centroCusto");
  const selectedCC = centrosCusto.find((c) => c.id === selectedCCId);
  const sitesForCC = selectedCC?.sites ?? [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!ACCEPTED_FILE_TYPES.includes(selected.type)) {
      setFileError("Apenas arquivos PDF ou DOC/DOCX são permitidos.");
      setFile(null);
      return;
    }
    setFileError("");
    setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: VagaForm) => {
    if (!file) {
      setFileError("O currículo é obrigatório.");
      return;
    }
    if (!docFile) {
      setDocError("O documento CNH ou RG com CPF é obrigatório.");
      return;
    }

    const ccObj = centrosCusto.find((c) => c.id === data.centroCusto);

    try {
      // Get current user for criado_por
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id || null;

      const vagaData: Record<string, unknown> = {
        cargo: data.cargo,
        salario: data.salario,
        centro_custo_nome: ccObj?.nome ?? "",
        centro_custo_codigo: ccObj?.codigo ?? "",
        site_contrato: data.tipoContrato,
        local_trabalho: data.localTrabalho,
        nome_candidato: data.nomeCandidato,
        data_nascimento: data.dataNascimento,
        telefone: data.telefone,
        beneficios: JSON.parse(JSON.stringify(beneficios)),
        curriculo_nome: file.name,
        documento_nome: docFile.name,
        status: "Aguardando Aprovação",
        status_processo: "Aguardando Diretoria",
        responsavel_etapa: "Diretoria",
        criado_por: currentUserId,
      };

      const vaga = await createVaga.mutateAsync(vagaData as VagaInsert);
      const numeroVaga = (vaga as any).numero_vaga || "";

      // Audit log
      await logAction({
        modulo: "Recursos Humanos",
        pagina: "Solicitação de Vaga",
        acao: "criacao",
        descricao: `Criou vaga ${numeroVaga}: ${data.cargo} — Candidato: ${data.nomeCandidato}`,
        registro_id: vaga.id,
        registro_ref: `${numeroVaga} - ${data.cargo} - ${data.nomeCandidato}`,
      });

      // Create notification for Diretoria
      await createNotificacao.mutateAsync({
        titulo: "Nova vaga aguardando aprovação",
        mensagem: `${numeroVaga} | Vaga: ${data.cargo} | Candidato: ${data.nomeCandidato} | CC: ${ccObj?.nome ?? ""} | Site: ${data.tipoContrato}`,
        tipo: "warning",
        link: "/rh/aprovacao-vaga",
        vaga_id: vaga.id,
      });

      // Call edge function for email notification (async, don't block)
      supabase.functions.invoke("notify-vaga", { body: { vaga } }).catch(console.error);

      toast.success(`Vaga ${numeroVaga} cadastrada com sucesso! Aguardando aprovação da Diretoria.`);
      form.reset();
      setFile(null);
      setDocFile(null);
      setBeneficios(defaultBeneficios);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (docInputRef.current) docInputRef.current.value = "";
    } catch {
      toast.error("Erro ao cadastrar vaga.");
    }
  };

  const handleCancel = () => {
    form.reset();
    setFile(null);
    setDocFile(null);
    setFileError("");
    setDocError("");
    setBeneficios(defaultBeneficios);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const emptyMessage = "Nenhum registro encontrado. Cadastre primeiro em Gestão RH.";

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, onChange: (v: string) => void) => {
    onChange(formatPhone(e.target.value));
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>, onChange: (v: string) => void) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    onChange(formatPhone(pasted));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Solicitação de Vaga
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Dados da Vaga */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="section-title">Dados da Vaga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cargo */}
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo / Função *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cargo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cargos.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">{emptyMessage}</div>
                          ) : (
                            cargos.map((c) => (
                              <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Salário */}
                <FormField
                  control={form.control}
                  name="salario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          value={field.value}
                          onChange={(e) => field.onChange(formatCurrencyBRL(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Centro de Custo */}
                <FormField
                  control={form.control}
                  name="centroCusto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Centro de Custo *</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          // Reset site when CC changes
                          form.setValue("tipoContrato", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o centro de custo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {centrosCusto.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">{emptyMessage}</div>
                          ) : (
                            centrosCusto.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.codigo ? `${c.codigo} - ${c.nome}` : c.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Local de Trabalho */}
                <FormField
                  control={form.control}
                  name="localTrabalho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local de Trabalho *</FormLabel>
                      <Popover open={cidadeOpen} onOpenChange={setCidadeOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                              {field.value || "Selecione a cidade"}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[350px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar cidade..." />
                            <CommandList>
                              <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                              <CommandGroup>
                                {cidadesBrasil.map((c) => {
                                  const label = getCidadeLabel(c);
                                  return (
                                    <CommandItem
                                      key={label}
                                      value={label}
                                      onSelect={() => {
                                        field.onChange(label);
                                        setCidadeOpen(false);
                                      }}
                                    >
                                      {label}
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Site / Contrato - filtered by selected CC */}
                <FormField
                  control={form.control}
                  name="tipoContrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site / Contrato (Local) *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!selectedCCId ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">Selecione um Centro de Custo primeiro.</div>
                          ) : sitesForCC.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">Nenhum site cadastrado para este Centro de Custo.</div>
                          ) : (
                            sitesForCC.map((s) => (
                              <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Benefícios */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="section-title">Benefícios</h3>
              <div className="space-y-4">
                {/* VA */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ben-va"
                      checked={beneficios.va}
                      onCheckedChange={(v) => setBeneficios((p) => ({ ...p, va: !!v, vaValor: v ? p.vaValor : "" }))}
                    />
                    <Label htmlFor="ben-va">VA (Vale Alimentação)</Label>
                  </div>
                  {beneficios.va && (
                    <Input
                      placeholder="R$ 0,00"
                      value={beneficios.vaValor}
                      onChange={(e) => setBeneficios((p) => ({ ...p, vaValor: formatCurrencyBRL(e.target.value) }))}
                      className="max-w-xs ml-6"
                    />
                  )}
                </div>

                {/* Auxílio Moradia */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ben-moradia"
                      checked={beneficios.auxilioMoradia}
                      onCheckedChange={(v) => setBeneficios((p) => ({ ...p, auxilioMoradia: !!v, auxilioMoradiaValor: v ? p.auxilioMoradiaValor : "" }))}
                    />
                    <Label htmlFor="ben-moradia">Auxílio Moradia</Label>
                  </div>
                  {beneficios.auxilioMoradia && (
                    <Input
                      placeholder="R$ 0,00"
                      value={beneficios.auxilioMoradiaValor}
                      onChange={(e) => setBeneficios((p) => ({ ...p, auxilioMoradiaValor: formatCurrencyBRL(e.target.value) }))}
                      className="max-w-xs ml-6"
                    />
                  )}
                </div>

                {/* Assiduidade */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ben-assiduidade"
                      checked={beneficios.assiduidade}
                      onCheckedChange={(v) => setBeneficios((p) => ({ ...p, assiduidade: !!v, assiduidadeValor: v ? p.assiduidadeValor : "" }))}
                    />
                    <Label htmlFor="ben-assiduidade">Assiduidade</Label>
                  </div>
                  {beneficios.assiduidade && (
                    <Input
                      placeholder="R$ 0,00"
                      value={beneficios.assiduidadeValor}
                      onChange={(e) => setBeneficios((p) => ({ ...p, assiduidadeValor: formatCurrencyBRL(e.target.value) }))}
                      className="max-w-xs ml-6"
                    />
                  )}
                </div>

                {/* Ajuda de Custo */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ben-ajuda-custo"
                      checked={beneficios.ajudaCusto}
                      onCheckedChange={(v) => setBeneficios((p) => ({ ...p, ajudaCusto: !!v, ajudaCustoValor: v ? p.ajudaCustoValor : "" }))}
                    />
                    <Label htmlFor="ben-ajuda-custo">Ajuda de Custo</Label>
                  </div>
                  {beneficios.ajudaCusto && (
                    <Input
                      placeholder="R$ 0,00"
                      value={beneficios.ajudaCustoValor}
                      onChange={(e) => setBeneficios((p) => ({ ...p, ajudaCustoValor: formatCurrencyBRL(e.target.value) }))}
                      className="max-w-xs ml-6"
                    />
                  )}
                </div>

                {/* Plano de Saúde */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ben-saude"
                    checked={beneficios.planoSaude}
                    onCheckedChange={(v) => setBeneficios((p) => ({ ...p, planoSaude: !!v }))}
                  />
                  <Label htmlFor="ben-saude">Plano de Saúde</Label>
                </div>

                {/* Plano Odontológico */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ben-odonto"
                    checked={beneficios.planoOdontologico}
                    onCheckedChange={(v) => setBeneficios((p) => ({ ...p, planoOdontologico: !!v }))}
                  />
                  <Label htmlFor="ben-odonto">Plano Odontológico</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Candidato */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="section-title">Dados do Candidato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nomeCandidato"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nome do Candidato *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataNascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone de Contato *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          value={field.value}
                          onChange={(e) => handlePhoneInput(e, field.onChange)}
                          onPaste={(e) => handlePhonePaste(e, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CNH ou RG */}
                <div className="md:col-span-2 mt-4">
                  <Label className="mb-2 block">CNH ou RG com CPF *</Label>
                  <div
                    className="border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => docInputRef.current?.click()}
                  >
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const selected = e.target.files?.[0];
                        if (!selected) return;
                        if (!ACCEPTED_DOC_TYPES.includes(selected.type)) {
                          setDocError("Apenas PDF, JPG ou PNG são permitidos.");
                          setDocFile(null);
                          return;
                        }
                        setDocError("");
                        setDocFile(selected);
                      }}
                    />
                    {docFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-foreground font-medium">{docFile.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setDocFile(null); if (docInputRef.current) docInputRef.current.value = ""; }} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Clique para anexar CNH ou RG com CPF</span>
                        <span className="text-xs">PDF, JPG ou PNG</span>
                      </div>
                    )}
                  </div>
                  {docError && <p className="text-sm text-destructive mt-2">{docError}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anexos */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="section-title">Anexos</h3>
              <div>
                <Label className="mb-2 block">Currículo do Candidato *</Label>
                <div
                  className="border-2 border-dashed border-input rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-foreground font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">Clique para anexar o currículo</span>
                      <span className="text-xs">PDF ou DOC/DOCX</span>
                    </div>
                  )}
                </div>
                {fileError && (
                  <p className="text-sm text-destructive mt-2">{fileError}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AberturaDeVaga;
