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
      colaboradores: {
        Row: {
          cargo: string
          centro_custo: string
          created_at: string
          data_admissao: string
          data_nascimento: string | null
          id: string
          nome: string
          site_contrato: string
          status: string
          telefone: string | null
          updated_at: string
          vaga_id: string | null
        }
        Insert: {
          cargo: string
          centro_custo: string
          created_at?: string
          data_admissao?: string
          data_nascimento?: string | null
          id?: string
          nome: string
          site_contrato: string
          status?: string
          telefone?: string | null
          updated_at?: string
          vaga_id?: string | null
        }
        Update: {
          cargo?: string
          centro_custo?: string
          created_at?: string
          data_admissao?: string
          data_nascimento?: string | null
          id?: string
          nome?: string
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
      notificacoes: {
        Row: {
          created_at: string
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
          beneficios: Json | null
          cargo: string
          centro_custo_codigo: string | null
          centro_custo_nome: string
          created_at: string
          criado_por: string | null
          curriculo_nome: string | null
          data_agendamento_aso: string | null
          data_entrega_aso: string | null
          data_nascimento: string
          documento_nome: string | null
          enviado_admissao: boolean
          enviado_admissao_at: string | null
          excluida: boolean
          excluida_at: string | null
          id: string
          local_trabalho: string
          motivo_exclusao: string | null
          nome_candidato: string
          observacao_reprovacao: string | null
          resultado_aso_nome: string | null
          resultado_aso_path: string | null
          salario: string
          site_contrato: string
          status: string
          status_candidato: string
          status_candidato_updated_at: string | null
          telefone: string
          updated_at: string
        }
        Insert: {
          beneficios?: Json | null
          cargo: string
          centro_custo_codigo?: string | null
          centro_custo_nome: string
          created_at?: string
          criado_por?: string | null
          curriculo_nome?: string | null
          data_agendamento_aso?: string | null
          data_entrega_aso?: string | null
          data_nascimento: string
          documento_nome?: string | null
          enviado_admissao?: boolean
          enviado_admissao_at?: string | null
          excluida?: boolean
          excluida_at?: string | null
          id?: string
          local_trabalho: string
          motivo_exclusao?: string | null
          nome_candidato: string
          observacao_reprovacao?: string | null
          resultado_aso_nome?: string | null
          resultado_aso_path?: string | null
          salario: string
          site_contrato: string
          status?: string
          status_candidato?: string
          status_candidato_updated_at?: string | null
          telefone: string
          updated_at?: string
        }
        Update: {
          beneficios?: Json | null
          cargo?: string
          centro_custo_codigo?: string | null
          centro_custo_nome?: string
          created_at?: string
          criado_por?: string | null
          curriculo_nome?: string | null
          data_agendamento_aso?: string | null
          data_entrega_aso?: string | null
          data_nascimento?: string
          documento_nome?: string | null
          enviado_admissao?: boolean
          enviado_admissao_at?: string | null
          excluida?: boolean
          excluida_at?: string | null
          id?: string
          local_trabalho?: string
          motivo_exclusao?: string | null
          nome_candidato?: string
          observacao_reprovacao?: string | null
          resultado_aso_nome?: string | null
          resultado_aso_path?: string | null
          salario?: string
          site_contrato?: string
          status?: string
          status_candidato?: string
          status_candidato_updated_at?: string | null
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
