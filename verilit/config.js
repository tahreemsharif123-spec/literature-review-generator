// Public Supabase settings for VeriLit.
// The anon key is meant to be public. Row Level Security in supabase/schema.sql
// makes sure each signed-in user can only read and change their own reviews.
window.VERILIT_SUPABASE = {
  url: "https://quikngydugyygrffgkpf.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1aWtuZ3lkdWd5eWdyZmZna3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NzY0NjMsImV4cCI6MjExMDI1MjQ2M30.yhI7IIT6bXTIg3Vqynpp25aDLtq27FFrutzXru-bmXQ"
};
