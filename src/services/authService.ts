import { supabase } from '@/lib/supabase'

export const authService = {
  getCurrentUser: async () => {
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  signOut: async () => {
    await supabase.auth.signOut()
  },
}
