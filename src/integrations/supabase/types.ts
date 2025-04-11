export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      appearance_settings: {
        Row: {
          accent_color: string | null
          created_at: string | null
          id: number
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          id?: number
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          id?: number
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      business_hours: {
        Row: {
          close_time: string
          created_at: string | null
          day_of_week: string
          id: number
          open_time: string
          updated_at: string | null
        }
        Insert: {
          close_time: string
          created_at?: string | null
          day_of_week: string
          id?: number
          open_time: string
          updated_at?: string | null
        }
        Update: {
          close_time?: string
          created_at?: string | null
          day_of_week?: string
          id?: number
          open_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_url: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_url?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          available_topping_categories: number[] | null
          category: string
          category_id: number | null
          description: string | null
          has_toppings: boolean
          id: number
          image: string | null
          name: string
          price: number
          status: string
        }
        Insert: {
          available_topping_categories?: number[] | null
          category: string
          category_id?: number | null
          description?: string | null
          has_toppings?: boolean
          id?: number
          image?: string | null
          name: string
          price: number
          status?: string
        }
        Update: {
          available_topping_categories?: number[] | null
          category?: string
          category_id?: number | null
          description?: string | null
          has_toppings?: boolean
          id?: number
          image?: string | null
          name?: string
          price?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_toppings: {
        Row: {
          id: number
          order_item_id: number | null
          price: number
          topping_id: number | null
        }
        Insert: {
          id?: number
          order_item_id?: number | null
          price: number
          topping_id?: number | null
        }
        Update: {
          id?: number
          order_item_id?: number | null
          price?: number
          topping_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_toppings_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_toppings_topping_id_fkey"
            columns: ["topping_id"]
            isOneToOne: false
            referencedRelation: "toppings"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: number
          menu_item_id: number | null
          notes: string | null
          order_id: number | null
          price: number
          quantity: number
        }
        Insert: {
          id?: number
          menu_item_id?: number | null
          notes?: string | null
          order_id?: number | null
          price: number
          quantity: number
        }
        Update: {
          id?: number
          menu_item_id?: number | null
          notes?: string | null
          order_id?: number | null
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_type: string
          id: number
          items_count: number
          order_number: string
          print_status: string | null
          status: string
          table_number: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          customer_type: string
          id?: number
          items_count: number
          order_number: string
          print_status?: string | null
          status?: string
          table_number?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          customer_type?: string
          id?: number
          items_count?: number
          order_number?: string
          print_status?: string | null
          status?: string
          table_number?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      print_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          job_id: string
          order_id: string | null
          printer_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_id: string
          order_id?: string | null
          printer_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string
          order_id?: string | null
          printer_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_info: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          id: number
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      topping_categories: {
        Row: {
          description: string | null
          display_order: number | null
          id: number
          max_selection: number
          min_selection: number
          name: string
          required: boolean
        }
        Insert: {
          description?: string | null
          display_order?: number | null
          id?: number
          max_selection?: number
          min_selection?: number
          name: string
          required?: boolean
        }
        Update: {
          description?: string | null
          display_order?: number | null
          id?: number
          max_selection?: number
          min_selection?: number
          name?: string
          required?: boolean
        }
        Relationships: []
      }
      toppings: {
        Row: {
          available: boolean
          category: string
          category_id: number | null
          display_order: number | null
          id: number
          max_quantity: number
          name: string
          price: number
        }
        Insert: {
          available?: boolean
          category: string
          category_id?: number | null
          display_order?: number | null
          id?: number
          max_quantity?: number
          name: string
          price: number
        }
        Update: {
          available?: boolean
          category?: string
          category_id?: number | null
          display_order?: number | null
          id?: number
          max_quantity?: number
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "toppings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "topping_categories"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
