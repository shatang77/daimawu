import { createClient } from '@supabase/supabase-js';
try {
  const c = createClient('https://hgidgvsxtcfllahwxwzh.supabase.co', 'sb_publishable_tl_poDeOGLIc6IYC_Muy_Q_qy_jwd8v');
  console.log('SUCCESS');
} catch(e) {
  console.error('FAILED:', e.message);
}
