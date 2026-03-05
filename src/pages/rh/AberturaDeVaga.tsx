import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const vagaSchema = z.object({
  cargo: z.string().min(1, "Cargo / Função é obrigatório").max(200),
  salario: z.string().min(1, "Salário é obrigatório").max(50),
  beneficios: z.string().min(1, "Benefícios é obrigatório").max(500),
  centroCusto: z.string().min(1, "Centro de Custo é obrigatório").max(100),
  localTrabalho: z.string().min(1, "Local de trabalho é obrigatório").max(200),
  tipoContrato: z.string().min(1, "Tipo de Contrato é obrigatório"),
  nomeCandidato: z.string().min(1, "Nome do Candidato é obrigatório").max(200),
  dataNascimento: z.string().min(1, "Data de Nascimento é obrigatória"),
  telefone: z.string().min(1, "Telefone de Contato é obrigatório").max(20),
});

type VagaForm = z.infer<typeof vagaSchema>;

const AberturaDeVaga = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  const form = useForm<VagaForm>({
    resolver: zodResolver(vagaSchema),
    defaultValues: {
      cargo: "",
      salario: "",
      beneficios: "",
      centroCusto: "",
      localTrabalho: "",
      tipoContrato: "",
      nomeCandidato: "",
      dataNascimento: "",
      telefone: "",
    },
  });

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

  const onSubmit = (data: VagaForm) => {
    if (!file) {
      setFileError("O currículo é obrigatório.");
      return;
    }

    // In a real app, this would save to the database with the file
    console.log("Vaga cadastrada:", { ...data, curriculo: file.name });
    toast.success("Vaga cadastrada com sucesso.");
    form.reset();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancel = () => {
    form.reset();
    setFile(null);
    setFileError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Abertura de Vaga
      </h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Dados da Vaga */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="section-title">Dados da Vaga</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cargo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo / Função *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Analista de Sistemas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: R$ 5.000,00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="beneficios"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Benefícios *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: VR, VT, Plano de Saúde" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="centroCusto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Centro de Custo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: TI-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="localTrabalho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local de Trabalho *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: São Paulo - SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipoContrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contrato *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clt">CLT</SelectItem>
                          <SelectItem value="pj">PJ</SelectItem>
                          <SelectItem value="estagio">Estágio</SelectItem>
                          <SelectItem value="temporario">Temporário</SelectItem>
                          <SelectItem value="terceirizado">Terceirizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
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
