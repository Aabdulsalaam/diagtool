-- Create assessments table for storing diagnostic results
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  respondent_name text not null,
  respondent_role text,
  respondent_email text,
  organization_name text not null,
  answers jsonb not null,
  scores jsonb not null,
  analysis jsonb not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table assessments enable row level security;

-- Allow anyone to submit an assessment
create policy "Anyone can insert assessments"
  on assessments for insert
  to anon
  with check (true);

-- Allow anyone to view an assessment by ID (public results link)
create policy "Anyone can view assessments"
  on assessments for select
  to anon
  using (true);
