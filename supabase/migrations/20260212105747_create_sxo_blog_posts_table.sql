-- Migration: create_sxo_blog_posts_table
-- Description: Creates the blog posts table for the SXO Website with full SEO metadata support
-- Author: supabase-db-manager
-- Date: 2026-02-12

-- Create the blog posts table
CREATE TABLE IF NOT EXISTS sxo_blog_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL,
  author text DEFAULT 'SXO Authority',
  category text,
  tags text[],
  meta_title text,
  meta_description text,
  og_image_url text,
  published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_blog_published ON sxo_blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON sxo_blog_posts(slug);

-- Enable RLS (Row Level Security)
ALTER TABLE sxo_blog_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access to published posts
CREATE POLICY "Public can read published blog posts" ON sxo_blog_posts
  FOR SELECT
  TO public
  USING (published = true);

-- Allow authenticated users to read all posts (including drafts)
CREATE POLICY "Authenticated users can read all blog posts" ON sxo_blog_posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert posts
CREATE POLICY "Authenticated users can create blog posts" ON sxo_blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update posts
CREATE POLICY "Authenticated users can update blog posts" ON sxo_blog_posts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete posts
CREATE POLICY "Authenticated users can delete blog posts" ON sxo_blog_posts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sxo_blog_posts_updated_at
  BEFORE UPDATE ON sxo_blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE sxo_blog_posts IS 'Blog posts for the SXO Website with full SEO metadata';
COMMENT ON COLUMN sxo_blog_posts.slug IS 'URL-friendly identifier for the blog post';
COMMENT ON COLUMN sxo_blog_posts.published IS 'Whether the post is visible to the public';
COMMENT ON COLUMN sxo_blog_posts.published_at IS 'Timestamp when the post was first published';
