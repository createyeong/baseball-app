import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://moxhdsqmlfvlwdfsntea.supabase.co'
const SUPABASE_KEY = 'sb_publishable_v6Q0Wkkq3X3qQL2nluzXQw_5ahzgaVm'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
