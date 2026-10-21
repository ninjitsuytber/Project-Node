CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    appearance_name VARCHAR(100) NOT NULL DEFAULT 'Alex Rivera',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.name_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    unit VARCHAR(60),
    occupation VARCHAR(100),
    bio TEXT,
    email VARCHAR(120),
    handle VARCHAR(80),
    helper_tags TEXT[],
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(30) NOT NULL CHECK (type IN ('urgent', 'notice', 'package', 'event')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    tag VARCHAR(50) NOT NULL,
    action_text VARCHAR(60),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_name VARCHAR(120) NOT NULL,
    unit VARCHAR(60) NOT NULL,
    phone VARCHAR(40),
    occupation VARCHAR(100),
    bio TEXT,
    tag VARCHAR(50) DEFAULT 'Community',
    category VARCHAR(40) DEFAULT 'feed',
    content TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.name_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read name cards" ON public.name_cards FOR SELECT USING (is_public = true);
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (is_active = true);
CREATE POLICY "Public read community posts" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "Public insert community posts" ON public.community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update post likes" ON public.community_posts FOR UPDATE USING (true);
INSERT INTO public.notifications (type, title, description, tag, action_text) VALUES
('urgent', 'Urgent: Water Supply Pipeline Maintenance', 'Scheduled maintenance for main water supply line tomorrow from 10:00 AM to 2:00 PM. Affected units: Block A & B. Please store necessary water beforehand.', 'Maintenance', 'View Schedule'),
('package', 'Smart Parcel Locker Delivery', 'Your courier parcel has been placed in Ground Floor Smart Locker #18. Use Pickup PIN: 8492. Locker reserved for 48 hours.', 'Delivery', 'Locker PIN: 8492'),
('event', 'Annual Neighborhood BBQ & Community Meetup', 'Join your fellow residents this Saturday at 5:00 PM in the Central Courtyard! Food, soft drinks, and kids activities provided. RSVP to assist catering count.', 'Event', 'RSVP Attendance'),
('notice', 'New Digital Visitor QR Pass Active at Main Gate', 'Security has updated the visitor intercom system. You can now issue guest QR passes directly via the Project Node directory for faster entry.', 'Security Notice', 'Read Guidelines');
INSERT INTO public.community_posts (author_name, unit, phone, occupation, bio, tag, category, content, likes_count, comments_count) VALUES
('Sarah Chen', 'Block 4, #08-12', '+1 (555) 482-1983', 'Botanist & Organic Baker', 'Balcony gardening enthusiast. Always happy to share fresh cuttings and starter sourdough.', 'Sharing', 'feed', 'Harvested fresh organic mint and fragrant rosemary from our balcony garden today. Six bundled packs are available in the ground lobby sharing basket. Please take what you need for tonight''s cooking.', 12, 3),
('Marcus Vance', 'Block 2, #04-06', '+1 (555) 720-3341', 'Software Engineer', 'Lover of table tennis and board games. Free on weekends.', 'Sports', 'feed', 'Organizing casual table tennis singles & doubles at the community clubhouse this Sunday at 3:00 PM. All skill levels welcome. Send a message if you would like to join.', 8, 5),
('Dr. Priya Patel', 'Block 1, #11-04', '+1 (555) 619-8902', 'Pediatric Specialist', 'Mother of two. Living here since 2020.', 'Recommendation', 'feed', 'Seeking recommendations for a trustworthy local electrician to inspect ceiling fan fixtures in Block 1. Any tested recommendations from neighbors are greatly appreciated.', 5, 7),
('Elena Rostova', 'Block 3, #02-15', '+1 (555) 901-4472', 'Graphic Artist', 'Cat mom and cyclist.', 'Lost & Found', 'lostfound', 'Found: A silver keychain with three keys and a bicycle charm near the bike racks by Gate 2. Delivered to the security guard post for safekeeping.', 16, 2);
