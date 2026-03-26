import type { UserRole, TeamColor, WorkOrderStatus, WorkType } from './enums'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string
          role: UserRole
          team: TeamColor | null
          pin_code: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          full_name: string
          role: UserRole
          team?: TeamColor | null
          pin_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string
          role?: UserRole
          team?: TeamColor | null
          pin_code?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          order_number: string
          client: string
          project: string
          operator: string
          line: string
          work_type: WorkType
          status: WorkOrderStatus
          assigned_team: TeamColor | null
          assigned_technician: string | null
          address: string | null
          postal_code: string | null
          city: string | null
          assigned_date: string | null
          priority: 'normal' | 'alta' | 'urgente'
          internal_notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          client: string
          project: string
          operator: string
          line: string
          work_type: WorkType
          status?: WorkOrderStatus
          assigned_team?: TeamColor | null
          assigned_technician?: string | null
          address?: string | null
          postal_code?: string | null
          city?: string | null
          assigned_date?: string | null
          priority?: 'normal' | 'alta' | 'urgente'
          internal_notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['work_orders']['Insert']>
      }
    }
    Enums: {
      user_role: UserRole
      team_color: TeamColor
      work_order_status: WorkOrderStatus
      work_type: WorkType
    }
  }
}
