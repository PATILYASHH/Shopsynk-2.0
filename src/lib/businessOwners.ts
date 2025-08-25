import { supabase } from './supabase'

export interface BusinessOwner {
  id: string
  user_id: string
  owner_name: string
  role: string
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OwnerStats {
  owner_id: string
  owner_name: string
  total_transactions: number
  total_purchases: number
  total_payments: number
  total_purchase_amount: number
  total_payment_amount: number
}

export class BusinessOwnersService {
  private static instance: BusinessOwnersService

  public static getInstance(): BusinessOwnersService {
    if (!BusinessOwnersService.instance) {
      BusinessOwnersService.instance = new BusinessOwnersService()
    }
    return BusinessOwnersService.instance
  }

  // Get all business owners for a user
  async getBusinessOwners(userId: string): Promise<BusinessOwner[]> {
    try {
      const { data, error } = await supabase
        .from('business_owners')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching business owners:', error)
      return []
    }
  }

  // Get primary owner for a user
  async getPrimaryOwner(userId: string): Promise<BusinessOwner | null> {
    try {
      const { data, error } = await supabase
        .from('business_owners')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (error) {
      console.error('Error fetching primary owner:', error)
      return null
    }
  }

  // Create a new business owner
  async createBusinessOwner(
    userId: string, 
    ownerData: Partial<BusinessOwner>
  ): Promise<{ success: boolean; data?: BusinessOwner; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('business_owners')
        .insert([
          {
            user_id: userId,
            owner_name: ownerData.owner_name,
            role: ownerData.role || 'Owner',
            is_primary: false, // Only one primary owner allowed
            is_active: true
          }
        ])
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      console.error('Error creating business owner:', error)
      return {
        success: false,
        error: error.message || 'Failed to create business owner'
      }
    }
  }

  // Update business owner
  async updateBusinessOwner(
    ownerId: string,
    updates: Partial<BusinessOwner>
  ): Promise<{ success: boolean; data?: BusinessOwner; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('business_owners')
        .update({
          owner_name: updates.owner_name,
          role: updates.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', ownerId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data
      }
    } catch (error: any) {
      console.error('Error updating business owner:', error)
      return {
        success: false,
        error: error.message || 'Failed to update business owner'
      }
    }
  }

  // Deactivate business owner (soft delete)
  async deactivateBusinessOwner(
    ownerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if this is the primary owner
      const { data: owner, error: fetchError } = await supabase
        .from('business_owners')
        .select('is_primary')
        .eq('id', ownerId)
        .single()

      if (fetchError) throw fetchError

      if (owner.is_primary) {
        return {
          success: false,
          error: 'Cannot deactivate the primary owner'
        }
      }

      const { error } = await supabase
        .from('business_owners')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', ownerId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Error deactivating business owner:', error)
      return {
        success: false,
        error: error.message || 'Failed to deactivate business owner'
      }
    }
  }

  // Get owner statistics
  async getOwnerStats(userId: string): Promise<OwnerStats[]> {
    try {
      const { data, error } = await supabase
        .from('owner_transaction_stats')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching owner stats:', error)
      return []
    }
  }

  // Ensure primary owner exists (call this when user first accesses owners)
  async ensurePrimaryOwner(userId: string, userEmail: string, userName?: string): Promise<BusinessOwner | null> {
    try {
      // Check if primary owner exists
      const existingPrimary = await this.getPrimaryOwner(userId)
      if (existingPrimary) {
        return existingPrimary
      }

      // Create primary owner
      const result = await this.createBusinessOwner(userId, {
        owner_name: userName || userEmail.split('@')[0],
        role: 'Primary Owner',
        is_primary: true
      })

      return result.success ? result.data! : null
    } catch (error) {
      console.error('Error ensuring primary owner:', error)
      return null
    }
  }

  // Update transaction with owner information
  async updateTransactionOwner(
    transactionId: string,
    ownerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ owner_id: ownerId })
        .eq('id', transactionId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Error updating transaction owner:', error)
      return {
        success: false,
        error: error.message || 'Failed to update transaction owner'
      }
    }
  }

  // Update supplier with owner information
  async updateSupplierOwner(
    supplierId: string,
    ownerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ added_by_owner_id: ownerId })
        .eq('id', supplierId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Error updating supplier owner:', error)
      return {
        success: false,
        error: error.message || 'Failed to update supplier owner'
      }
    }
  }
}
