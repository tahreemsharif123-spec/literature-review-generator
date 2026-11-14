// Public Supabase settings for VeriLit.
// The anon key is meant to be public. Row Level Security in supabase/schema.sql
// makes sure each signed-in user can only read and change their own reviews.
window.VERILIT_SUPABASE = {
  url: "",
  anonKey: ""
};
