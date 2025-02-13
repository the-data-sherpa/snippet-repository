# Snippit Repository

A web application for storing and sharing code snippets, built with Next.js, TypeScript, and Supabase.

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Supabase account

## Setup

1. Clone the repository:
```bash
git clone git@github.com:the-data-sherpa/snippet-repository.git
cd snippit-repository
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon/public key

4. Set up your environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

5. Set up the database schema:
   - Go to your Supabase project's SQL editor
   - Run the following SQL to create the profiles table:

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  name text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policy to allow users to read their own profile
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

-- Create policy to allow users to update their own profile
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );
```

6. Configure authentication:
   - In your Supabase dashboard, go to Authentication > Settings
   - Enable Email provider
   - Configure email templates if desired
   - Set up any additional providers as needed

7. Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Features

- User authentication with email/password
- Profile management
- Code snippet creation and sharing
- Restricted to @cribl.io email domains
- Responsive design

## Development

- Built with Next.js 14
- TypeScript for type safety
- Tailwind CSS for styling
- Supabase for backend and authentication

## Project Structure

```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                 # Utility functions and configurations
└── types/              # TypeScript type definitions
```

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project's anon/public key

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
