import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Supplier {
  id: string
  user_id: string
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  added_by_owner_id?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  supplier_id: string
  owner_id?: string
  type: 'pay_due' | 'settle_bill' | 'new_purchase'
  amount: number
  description: string
  due_date?: string
  is_paid: boolean
  created_at: string
  updated_at: string
  supplier?: Supplier
  owner?: {
    owner_name: string
  }
}

export interface User {
  id: string
  email: string
}

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}