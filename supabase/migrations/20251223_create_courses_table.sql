-- Create courses table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  filename text not null,
  created_at timestamptz default now()
);

-- Insert your courses
insert into public.courses (slug, title, filename) values
('credit-optimization-101', 'Credit Optimization 101', 'Credit Optimization Course.pdf'),
('advanced-credit-optimization', 'Advanced Credit Optimization Strategies', 'Advanced Credit Optimization Strategies.pdf'),
('understanding-credit-reports', 'Understanding Credit Reports', 'Understanding Your Credit Report.pdf'),
('building-credit-responsibly', 'Building Credit Responsibly', 'Building Your Credit Responsibly.pdf'),
('credit-utilization-management', 'Credit Utilization & Management', 'Credit Utilization & Management.pdf'),
('financial-education-basics', 'Financial Education Basics', 'Financial Education Basics.pdf'),
('budgeting-for-better-credit', 'Budgeting for Better Credit', 'Budgeting for Better Credit.pdf'),
('smart-borrowing-techniques', 'Smart Borrowing Techniques', 'Smart Borrowing Techniques.pdf'),
('debt-reduction-recovery', 'Debt Reduction & Recovery', 'Debt Reduction & Recovery.pdf'),
('using-credit-to-invest', 'Using Credit to Invest', 'Using Credit To Invest.pdf'),
('leveraging-business-credit', 'Leveraging Business Credit', 'Leveraging Business Credit.pdf'),
('financial-freedom-through-credit', 'Financial Freedom Through Credit', 'Financial Freedom Through Credit.pdf');