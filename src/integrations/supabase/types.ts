export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admissao_documentos: {
        Row: {
          anexado_em: string | null
          anexado_por: string | null
          anexado_por_id: string | null
          arquivo_nome: string | null
          arquivo_path: string | null
          created_at: string
          id: string
          status: string
          tipo_documento: string
          updated_at: string
          vaga_id: string
        }
        Insert: {
          anexado_em?: string | null
          anexado_por?: string | null
          anexado_por_id?: string | null
          arquivo_nome?: string | null
          arquivo_path?: string | null
          created_at?: string
          id?: string
          status?: string
          tipo_documento: string
          updated_at?: string
          vaga_id: string
        }
        Update: {
          anexado_em?: string | null
          anexado_por?: string | null
          anexado_por_id?: string | null
          arquivo_nome?: string | null
          arquivo_path?: string | null
          created_at?: string
          id?: string
          status?: string
          tipo_documento?: string
          updated_at?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissao_documentos_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          acao: string
          created_at: string
          dados_extras: Json | null
          descricao: string
          id: string
          modulo: string
          motivo: string | null
          pagina: string
          registro_id: string | null
          registro_ref: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          acao: string
          created_at?: string
          dados_extras?: Json | null
          descricao: string
          id?: string
          modulo: string
          motivo?: string | null
          pagina: string
          registro_id?: string | null
          registro_ref?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          acao?: string
          created_at?: string
          dados_extras?: Json | null
          descricao?: string
          id?: string
          modulo?: string
          motivo?: string | null
          pagina?: string
          registro_id?: string | null
          registro_ref?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      cargos: {
        Row: {
          created_at: string
          descricao: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      centros_custo: {
        Row: {
          codigo: string
          created_at: string
          id: string
          nome: string
          sites: Json
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          nome: string
          sites?: Json
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          nome?: string
          sites?: Json
          updated_at?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          agencia: string | null
          bairro: string | null
          banco: string | null
          cargo: string
          centro_custo: string
          cep: string | null
          cidade: string | null
          complemento: string | null
          conta: string | null
          contrato: string | null
          cpf: string | null
          created_at: string
          data_admissao: string
          data_desligamento: string | null
          data_nascimento: string | null
          digito_agencia: string | null
          digito_conta: string | null
          email: string | null
          estado: string | null
          id: string
          logradouro: string | null
          nome: string
          numero: string | null
          sexo: string | null
          site_contrato: string
          status: string
          telefone: string | null
          updated_at: string
          vaga_id: string | null
        }
        Insert: {
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          cargo: string
          centro_custo: string
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          conta?: string | null
          contrato?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string
          data_desligamento?: string | null
          data_nascimento?: string | null
          digito_agencia?: string | null
          digito_conta?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome: string
          numero?: string | null
          sexo?: string | null
          site_contrato: string
          status?: string
          telefone?: string | null
          updated_at?: string
          vaga_id?: string | null
        }
        Update: {
          agencia?: string | null
          bairro?: string | null
          banco?: string | null
          cargo?: string
          centro_custo?: string
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          conta?: string | null
          contrato?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string
          data_desligamento?: string | null
          data_nascimento?: string | null
          digito_agencia?: string | null
          digito_conta?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          logradouro?: string | null
          nome?: string
          numero?: string | null
          sexo?: string | null
          site_contrato?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores_historico: {
        Row: {
          alterado_por: string
          campo_alterado: string
          colaborador_id: string
          created_at: string
          id: string
          motivo: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          alterado_por: string
          campo_alterado: string
          colaborador_id: string
          created_at?: string
          id?: string
          motivo: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          alterado_por?: string
          campo_alterado?: string
          colaborador_id?: string
          created_at?: string
          id?: string
          motivo?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_historico_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          cliente: string
          created_at: string
          data_inicio: string
          data_termino: string
          id: string
          numero_contrato: string
          projeto_obra: string
          responsavel: string
          status: string
          updated_at: string
          valor_contrato: number
        }
        Insert: {
          cliente: string
          created_at?: string
          data_inicio: string
          data_termino: string
          id?: string
          numero_contrato: string
          projeto_obra: string
          responsavel: string
          status?: string
          updated_at?: string
          valor_contrato?: number
        }
        Update: {
          cliente?: string
          created_at?: string
          data_inicio?: string
          data_termino?: string
          id?: string
          numero_contrato?: string
          projeto_obra?: string
          responsavel?: string
          status?: string
          updated_at?: string
          valor_contrato?: number
        }
        Relationships: []
      }
      frequencia: {
        Row: {
          colaborador_id: string
          created_at: string
          data: string
          id: string
          observacao: string | null
          registrado_por: string | null
          registrado_por_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string
          data: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          registrado_por_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          registrado_por_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "frequencia_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      medicoes: {
        Row: {
          contrato_id: string
          created_at: string
          data_fim: string
          data_inicio: string
          descricao: string
          id: string
          observacao: string | null
          updated_at: string
          valor_medido: number
        }
        Insert: {
          contrato_id: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao: string
          id?: string
          observacao?: string | null
          updated_at?: string
          valor_medido?: number
        }
        Update: {
          contrato_id?: string
          created_at?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string
          id?: string
          observacao?: string | null
          updated_at?: string
          valor_medido?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          destinatario_grupo: string | null
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          tipo: string
          titulo: string
          vaga_id: string | null
        }
        Insert: {
          created_at?: string
          destinatario_grupo?: string | null
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          tipo?: string
          titulo: string
          vaga_id?: string | null
        }
        Update: {
          created_at?: string
          destinatario_grupo?: string | null
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo?: string
          vaga_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
      organograma_nodes: {
        Row: {
          cargo: string
          colaborador_id: string | null
          contrato_id: string
          created_at: string
          id: string
          nome_colaborador: string
          observacao: string | null
          quantidade: number
          superior_id: string | null
          updated_at: string
        }
        Insert: {
          cargo: string
          colaborador_id?: string | null
          contrato_id: string
          created_at?: string
          id?: string
          nome_colaborador?: string
          observacao?: string | null
          quantidade?: number
          superior_id?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string
          colaborador_id?: string | null
          contrato_id?: string
          created_at?: string
          id?: string
          nome_colaborador?: string
          observacao?: string | null
          quantidade?: number
          superior_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organograma_nodes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organograma_nodes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organograma_nodes_superior_id_fkey"
            columns: ["superior_id"]
            isOneToOne: false
            referencedRelation: "organograma_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string
          grupo_permissao: string
          id: string
          must_change_password: boolean
          nome: string
          super_admin: boolean
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email: string
          grupo_permissao?: string
          id?: string
          must_change_password?: boolean
          nome: string
          super_admin?: boolean
          user_id: string
        }
        Update: {
          ativo?: boolean
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string
          grupo_permissao?: string
          id?: string
          must_change_password?: boolean
          nome?: string
          super_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
      vagas: {
        Row: {
          agencia: string | null
          atualizado_por: string | null
          bairro: string | null
          banco: string | null
          beneficios: Json | null
          cargo: string
          centro_custo_codigo: string | null
          centro_custo_nome: string
          cep: string | null
          cidade: string | null
          complemento: string | null
          conta: string | null
          cpf: string | null
          created_at: string
          criado_por: string | null
          curriculo_nome: string | null
          curriculo_path: string | null
          data_agendamento_aso: string | null
          data_entrega_aso: string | null
          data_nascimento: string
          digito_agencia: string | null
          digito_conta: string | null
          documento_nome: string | null
          documento_path: string | null
          enviado_admissao: boolean
          enviado_admissao_at: string | null
          estado: string | null
          excluida: boolean
          excluida_at: string | null
          id: string
          local_trabalho: string
          logradouro: string | null
          motivo_exclusao: string | null
          nome_candidato: string
          numero: string | null
          numero_vaga: string | null
          observacao_reprovacao: string | null
          responsavel_etapa: string
          resultado_aso_nome: string | null
          resultado_aso_path: string | null
          salario: string
          sexo: string | null
          site_contrato: string
          status: string
          status_candidato: string
          status_candidato_updated_at: string | null
          status_processo: string
          telefone: string
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          atualizado_por?: string | null
          bairro?: string | null
          banco?: string | null
          beneficios?: Json | null
          cargo: string
          centro_custo_codigo?: string | null
          centro_custo_nome: string
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string
          criado_por?: string | null
          curriculo_nome?: string | null
          curriculo_path?: string | null
          data_agendamento_aso?: string | null
          data_entrega_aso?: string | null
          data_nascimento: string
          digito_agencia?: string | null
          digito_conta?: string | null
          documento_nome?: string | null
          documento_path?: string | null
          enviado_admissao?: boolean
          enviado_admissao_at?: string | null
          estado?: string | null
          excluida?: boolean
          excluida_at?: string | null
          id?: string
          local_trabalho: string
          logradouro?: string | null
          motivo_exclusao?: string | null
          nome_candidato: string
          numero?: string | null
          numero_vaga?: string | null
          observacao_reprovacao?: string | null
          responsavel_etapa?: string
          resultado_aso_nome?: string | null
          resultado_aso_path?: string | null
          salario: string
          sexo?: string | null
          site_contrato: string
          status?: string
          status_candidato?: string
          status_candidato_updated_at?: string | null
          status_processo?: string
          telefone: string
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          atualizado_por?: string | null
          bairro?: string | null
          banco?: string | null
          beneficios?: Json | null
          cargo?: string
          centro_custo_codigo?: string | null
          centro_custo_nome?: string
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          conta?: string | null
          cpf?: string | null
          created_at?: string
          criado_por?: string | null
          curriculo_nome?: string | null
          curriculo_path?: string | null
          data_agendamento_aso?: string | null
          data_entrega_aso?: string | null
          data_nascimento?: string
          digito_agencia?: string | null
          digito_conta?: string | null
          documento_nome?: string | null
          documento_path?: string | null
          enviado_admissao?: boolean
          enviado_admissao_at?: string | null
          estado?: string | null
          excluida?: boolean
          excluida_at?: string | null
          id?: string
          local_trabalho?: string
          logradouro?: string | null
          motivo_exclusao?: string | null
          nome_candidato?: string
          numero?: string | null
          numero_vaga?: string | null
          observacao_reprovacao?: string | null
          responsavel_etapa?: string
          resultado_aso_nome?: string | null
          resultado_aso_path?: string | null
          salario?: string
          sexo?: string | null
          site_contrato?: string
          status?: string
          status_candidato?: string
          status_candidato_updated_at?: string | null
          status_processo?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      vagas_historico: {
        Row: {
          acao: string
          created_at: string
          id: string
          motivo: string | null
          usuario_nome: string
          vaga_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          id?: string
          motivo?: string | null
          usuario_nome: string
          vaga_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          motivo?: string | null
          usuario_nome?: string
          vaga_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vagas_historico_vaga_id_fkey"
            columns: ["vaga_id"]
            isOneToOne: false
            referencedRelation: "vagas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
