# Snippit Repository

A full-stack web application for sharing and managing code snippets with syntax highlighting, voting, and tagging functionality.

## Features

- 🔐 User authentication with Supabase
- 📝 Create, edit, and delete code snippets
- 🔍 Search snippets by title, description, or language
- 🏷️ Tag-based filtering
- ⬆️ Upvote/downvote system
- ✨ Syntax highlighting for multiple languages
- 📱 Responsive design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- Prism.js (Syntax Highlighting)

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd snippit-repository
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project and get your credentials:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Get your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

Run the following SQL commands in your Supabase SQL editor:

1. Create profiles table:
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade,
  email text unique,
  username text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create profiles policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update their own profile"
  on profiles for update
  using ( auth.uid() = id );
```

2. Create snippets table:
```sql
create table public.snippets (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  code text not null,
  language text not null,
  tags text[] default '{}',
  username text references public.profiles(username) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.snippets enable row level security;

-- Create snippets policies
create policy "Snippets are viewable by everyone"
  on snippets for select
  using ( true );

create policy "Users can create snippets"
  on snippets for insert
  with check ( auth.uid() in (
    select id from profiles where profiles.username = snippets.username
  ));

create policy "Users can update their own snippets"
  on snippets for update
  using ( auth.uid() in (
    select id from profiles where profiles.username = snippets.username
  ));

create policy "Users can delete their own snippets"
  on snippets for delete
  using ( auth.uid() in (
    select id from profiles where profiles.username = snippets.username
  ));
```

3. Create snippet_votes table:
```sql
create table public.snippet_votes (
  id uuid default uuid_generate_v4() primary key,
  snippet_id uuid references public.snippets(id) on delete cascade,
  username text references public.profiles(username) on delete cascade,
  vote_type boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  unique(snippet_id, username)
);

-- Enable RLS
alter table public.snippet_votes enable row level security;

-- Create vote policies
create policy "Users can vote"
  on public.snippet_votes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own votes"
  on public.snippet_votes
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own votes"
  on public.snippet_votes
  for delete
  using (auth.uid() = user_id);

create policy "Votes are visible to everyone"
  on public.snippet_votes
  for select
  using (true);
```

## Running the Project

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Authentication Flow

1. Users can register with email/password
2. Email verification is required
3. Users must create a username after registration
4. Profile information is stored in the profiles table

## Features Usage

### Creating Snippets
- Click "Create New Snippet" button
- Fill in title, description, code, language, and tags
- Tags should be comma-separated

### Voting
- Users must be logged in to vote
- Click up/down arrows to vote
- Click again to remove vote
- Click opposite arrow to change vote

### Filtering
- Use the search bar to filter by title, description, or language
- Use tag buttons to filter by tags
- Combine search and tag filters

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Your chosen license]
