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
   - Run the following SQL to create all of the needed tables:

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_username_key UNIQUE (username),
  CONSTRAINT profiles_username_unique UNIQUE (username),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.snippets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  title text NOT NULL,
  description text NULL,
  code text NOT NULL,
  language text NOT NULL,
  tags text[] NULL DEFAULT '{}'::text[],
  username text NOT NULL DEFAULT 'anonymous'::text,
  CONSTRAINT snippets_pkey PRIMARY KEY (id),
  CONSTRAINT snippets_username_fkey FOREIGN KEY (username) REFERENCES profiles(username) ON DELETE CASCADE
);

CREATE TABLE public.snippet_comments (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  snippet_id uuid NULL,
  username text NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT snippet_comments_pkey PRIMARY KEY (id),
  CONSTRAINT snippet_comments_snippet_id_fkey FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
  CONSTRAINT snippet_comments_username_fkey FOREIGN KEY (username) REFERENCES profiles(username) ON DELETE CASCADE
);

CREATE TABLE public.snippet_votes (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  snippet_id uuid NULL,
  username text NULL,
  vote_type boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id uuid NOT NULL,
  CONSTRAINT snippet_votes_pkey PRIMARY KEY (id),
  CONSTRAINT snippet_votes_snippet_id_username_key UNIQUE (snippet_id, username),
  CONSTRAINT snippet_votes_snippet_id_fkey FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
  CONSTRAINT snippet_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT snippet_votes_username_fkey FOREIGN KEY (username) REFERENCES profiles(username) ON DELETE CASCADE
);

CREATE TABLE public.username_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  old_username text NOT NULL,
  new_username text NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  profile_id uuid NOT NULL,
  CONSTRAINT username_history_pkey PRIMARY KEY (id),
  CONSTRAINT username_history_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES profiles(id)
);
```

6. Set up the Role Level Security (RLS) policies:
   - Go to your Supabase project's RLS policies
   - Set the policies for the snippets, snippet_comments, snippet_votes, and username_history tables

```sql
CREATE POLICY "Users can read their own profiles" ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert profiles" ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own profiles" ON public.profiles
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK (true);

CREATE POLICY "Users can delete their own profiles" ON public.profiles
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can read all snippets" ON public.snippets
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can insert snippets" ON public.snippets
FOR INSERT
TO authenticated
WITH CHECK ((SELECT profiles.username FROM profiles WHERE (profiles.email = (auth.jwt() ->> 'email'::text))) = username);

CREATE POLICY "Users can update their own snippets" ON public.snippets
FOR UPDATE
TO authenticated
USING ((SELECT profiles.username FROM profiles WHERE (profiles.email = (auth.jwt() ->> 'email'::text))) = username)
WITH CHECK (true);

CREATE POLICY "Users can delete their own snippets" ON public.snippets
FOR DELETE
TO authenticated
USING ((SELECT profiles.username FROM profiles WHERE (profiles.email = (auth.jwt() ->> 'email'::text))) = username);

CREATE POLICY "Users can read all comments" ON public.snippet_comments
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can insert comments" ON public.snippet_comments
FOR INSERT
TO authenticated
WITH CHECK ((SELECT profiles.username FROM profiles WHERE (profiles.email = (auth.jwt() ->> 'email'::text))) = username);

CREATE POLICY "Users can update their own comments" ON public.snippet_comments
FOR UPDATE
TO authenticated
USING ((SELECT profiles.username FROM profiles WHERE (profiles.email = (auth.jwt() ->> 'email'::text))) = username)
WITH CHECK (true);

CREATE POLICY "Users can delete their own comments" ON public.snippet_comments
FOR DELETE
TO authenticated
USING ((SELECT profiles.username FROM profiles WHERE (profiles.email = (auth.jwt() ->> 'email'::text))) = username);

CREATE POLICY "Users can read all votes" ON public.snippet_votes
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can insert votes" ON public.snippet_votes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.snippet_votes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (true);

CREATE POLICY "Users can delete their own votes" ON public.snippet_votes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can read username history" ON public.username_history
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Users can insert username history" ON public.username_history
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own username history" ON public.username_history
FOR UPDATE
TO authenticated
USING ((SELECT profiles.id FROM profiles WHERE (profiles.username = (SELECT username FROM public.username_history WHERE id = (SELECT auth.uid())))) = profile_id)
WITH CHECK (true);

CREATE POLICY "Users can delete their own username history" ON public.username_history
FOR DELETE
TO authenticated
USING ((SELECT profiles.id FROM profiles WHERE (profiles.username = (SELECT username FROM public.username_history WHERE id = (SELECT auth.uid())))) = profile_id);
```

8. Configure authentication:
   - In your Supabase dashboard, go to Authentication > Settings
   - Enable Email provider
   - Configure email templates if desired
   - Set up any additional providers as needed

9. Run the development server:
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

## Docker Deployment

You can deploy this application using Docker:

### Prerequisites

- Docker and Docker Compose installed on your server
- Supabase project set up (as described in the Setup section)

### Deployment Steps

1. Clone the repository on your server:
```bash
git clone git@github.com:the-data-sherpa/snippet-repository.git
cd snippit-repository
```

2. Set up your environment variables:
```bash
./setup-env.sh
```
This script will prompt you for your Supabase URL and Anon Key.

3. Build and start the Docker containers:
```bash
./deploy.sh
```

4. The application will be available at http://your-server-ip:3000

### Updating the Application

To update the application to the latest version:

```bash
git pull
./deploy.sh
```

### Viewing Logs

To view the application logs:

```bash
docker-compose logs -f app
```

### Troubleshooting

If you encounter issues during deployment:

1. Make sure your Supabase credentials are correct
2. Check the Docker logs: `docker-compose logs -f app`
3. Ensure your Supabase project has the correct database schema and RLS policies

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
