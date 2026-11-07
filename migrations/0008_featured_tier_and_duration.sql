-- Add featured tier and duration columns
alter table apps add column if not exists featured_tier text default 'featured';
alter table apps add column if not exists featured_until timestamptz;
alter table submissions add column if not exists tier text default 'featured';

-- Update existing Editor's Choice apps to have a 30-day window and gold tier
update apps 
set featured_tier = 'article', 
    featured_until = now() + interval '30 days'
where editor_choice = true and (featured_until is null or featured_tier is null);
