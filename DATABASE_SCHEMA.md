# VerChem Database Schema

**Database**: Supabase (PostgreSQL)
**Created**: 2025-11-21
**Author**: สมนึก (Claude Sonnet 4.5)
**Status**: Ready for implementation

---

## Overview

VerChem requires a database to support:
1. **User Authentication** (via AIVerID OAuth)
2. **Saved Calculations** (premium feature)
3. **Favorites** (elements, compounds)
4. **User Preferences** (theme, units, language)
5. **Usage Analytics** (privacy-friendly)

---

## Tables

### 1. `users`

Stores user information synced from AIVerID.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aiverid_id TEXT UNIQUE NOT NULL,  -- AIVerID user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'free',  -- 'free', 'premium', 'pro', 'enterprise'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_aiverid ON users(aiverid_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

---

### 2. `saved_calculations`

Stores user's saved calculations (premium feature).

```sql
CREATE TABLE saved_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  calculator_type TEXT NOT NULL,  -- 'equation', 'stoichiometry', 'ph', 'gas', etc.
  title TEXT NOT NULL,  -- User-given name
  input_data JSONB NOT NULL,  -- All input parameters
  result_data JSONB NOT NULL,  -- Calculation results
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,  -- For sharing
  share_token TEXT UNIQUE,  -- For public sharing (premium)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_calculator_type CHECK (
    calculator_type IN (
      'equation-balancer',
      'stoichiometry',
      'solutions',
      'gas-laws',
      'thermodynamics',
      'kinetics',
      'electrochemistry',
      'electron-config',
      'vsepr',
      'lewis',
      'molecule-builder',
      'virtual-lab',
      '3d-viewer',
      'periodic-table'
    )
  )
);

-- Indexes
CREATE INDEX idx_saved_calculations_user ON saved_calculations(user_id);
CREATE INDEX idx_saved_calculations_type ON saved_calculations(calculator_type);
CREATE INDEX idx_saved_calculations_favorite ON saved_calculations(user_id, is_favorite);
CREATE INDEX idx_saved_calculations_share_token ON saved_calculations(share_token) WHERE share_token IS NOT NULL;

-- RLS
ALTER TABLE saved_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calculations" ON saved_calculations
  FOR SELECT USING (
    user_id = auth.uid() OR
    (is_public = TRUE AND share_token IS NOT NULL)
  );

CREATE POLICY "Users can insert own calculations" ON saved_calculations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own calculations" ON saved_calculations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own calculations" ON saved_calculations
  FOR DELETE USING (user_id = auth.uid());
```

**Example data**:
```json
{
  "calculator_type": "ph",
  "title": "pH of 0.01 M HCl",
  "input_data": {
    "mode": "strong_acid",
    "concentration": 0.01,
    "compound": "HCl"
  },
  "result_data": {
    "pH": 2.0,
    "pOH": 12.0,
    "H_concentration": 0.01,
    "OH_concentration": 1e-12
  }
}
```

---

### 3. `favorites`

Stores user's favorite elements and compounds.

```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,  -- 'element' or 'compound'
  item_id TEXT NOT NULL,  -- Element symbol (e.g., 'H') or compound formula (e.g., 'H2O')
  notes TEXT,  -- User's personal notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_item_type CHECK (item_type IN ('element', 'compound')),
  UNIQUE(user_id, item_type, item_id)
);

-- Indexes
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_type ON favorites(item_type);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (user_id = auth.uid());
```

---

### 4. `user_preferences`

Stores user preferences and settings.

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'auto',  -- 'light', 'dark', 'auto'
  language TEXT DEFAULT 'en',  -- 'en', 'th'
  units TEXT DEFAULT 'si',  -- 'si', 'imperial'
  decimal_places INTEGER DEFAULT 3,
  show_steps BOOLEAN DEFAULT TRUE,
  auto_save BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}'::jsonb,  -- Additional custom preferences
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_theme CHECK (theme IN ('light', 'dark', 'auto')),
  CONSTRAINT check_language CHECK (language IN ('en', 'th')),
  CONSTRAINT check_units CHECK (units IN ('si', 'imperial')),
  CONSTRAINT check_decimal_places CHECK (decimal_places BETWEEN 0 AND 10)
);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());
```

---

### 5. `calculation_history`

Tracks calculation usage for analytics (privacy-friendly).

```sql
CREATE TABLE calculation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Nullable for anonymous users
  calculator_type TEXT NOT NULL,
  calculation_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,  -- Browser, OS, etc. (anonymized)

  CONSTRAINT check_calculator_type_history CHECK (
    calculator_type IN (
      'equation-balancer',
      'stoichiometry',
      'solutions',
      'gas-laws',
      'thermodynamics',
      'kinetics',
      'electrochemistry',
      'electron-config',
      'vsepr',
      'lewis',
      'molecule-builder',
      'virtual-lab',
      '3d-viewer',
      'periodic-table'
    )
  )
);

-- Indexes
CREATE INDEX idx_calculation_history_user ON calculation_history(user_id);
CREATE INDEX idx_calculation_history_type ON calculation_history(calculator_type);
CREATE INDEX idx_calculation_history_date ON calculation_history(last_used);

-- RLS
ALTER TABLE calculation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" ON calculation_history
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can insert history" ON calculation_history
  FOR INSERT WITH CHECK (true);  -- Allow anonymous tracking
```

---

### 6. `subscriptions` (Future - Stripe integration)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL,  -- 'free', 'premium', 'pro', 'enterprise'
  status TEXT NOT NULL,  -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT check_plan CHECK (plan IN ('free', 'premium', 'pro', 'enterprise')),
  CONSTRAINT check_status CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete'))
);

-- Indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());
```

---

## Functions

### Update `updated_at` timestamp automatically

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_calculations_updated_at
  BEFORE UPDATE ON saved_calculations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Seed Data (Development)

```sql
-- Insert test user
INSERT INTO users (id, aiverid_id, email, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'aiverid_test_user_1',
  'test@verchem.xyz',
  'Test User',
  'premium'
);

-- Insert test preferences
INSERT INTO user_preferences (user_id)
VALUES ('00000000-0000-0000-0000-000000000001');

-- Insert test calculation
INSERT INTO saved_calculations (user_id, calculator_type, title, input_data, result_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'solutions',
  'pH of 0.01 M HCl',
  '{"mode": "strong_acid", "concentration": 0.01}'::jsonb,
  '{"pH": 2.0, "pOH": 12.0}'::jsonb
);

-- Insert test favorites
INSERT INTO favorites (user_id, item_type, item_id, notes)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'element', 'H', 'Most abundant element'),
  ('00000000-0000-0000-0000-000000000001', 'compound', 'H2O', 'Universal solvent');
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AIVerID OAuth
AIVERID_CLIENT_ID=your-client-id
AIVERID_CLIENT_SECRET=your-client-secret
AIVERID_ISSUER=https://aivisibilityrights.com

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

---

## Implementation Steps

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project: `verchem`
   - Copy connection details

2. **Run Schema**
   - Open SQL Editor in Supabase
   - Copy and run all CREATE TABLE statements
   - Run all CREATE INDEX statements
   - Run all CREATE POLICY statements
   - Run functions and triggers

3. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   ```

4. **Create Supabase Client**
   ```typescript
   // lib/supabase/client.ts
   import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

   export const supabase = createClientComponentClient()
   ```

5. **Update NextAuth to use Supabase**
   - See AIVERID_INTEGRATION.md for details

---

## API Usage Examples

### Save a calculation

```typescript
import { supabase } from '@/lib/supabase/client'

const saveCalculation = async (data) => {
  const { data: result, error } = await supabase
    .from('saved_calculations')
    .insert({
      user_id: user.id,
      calculator_type: 'solutions',
      title: 'pH of 0.01 M HCl',
      input_data: { concentration: 0.01 },
      result_data: { pH: 2.0 }
    })
    .select()
    .single()

  if (error) throw error
  return result
}
```

### Get user's saved calculations

```typescript
const getSavedCalculations = async () => {
  const { data, error } = await supabase
    .from('saved_calculations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

### Add favorite

```typescript
const addFavorite = async (type, id) => {
  const { error } = await supabase
    .from('favorites')
    .insert({
      user_id: user.id,
      item_type: type,
      item_id: id
    })

  if (error) throw error
}
```

---

## Security

1. **Row Level Security (RLS)**: Enabled on all tables
2. **Authentication**: Required for all user-specific operations
3. **Data Privacy**: Anonymous tracking allowed, but no PII stored
4. **Encryption**: All data encrypted at rest (Supabase default)
5. **Backups**: Automatic daily backups (Supabase)

---

## Performance

1. **Indexes**: Created on all foreign keys and frequently queried columns
2. **JSONB**: Used for flexible data storage (calculations, preferences)
3. **Partitioning**: Consider for `calculation_history` when > 1M rows
4. **Caching**: Use React Query or SWR for client-side caching

---

**Ready for implementation!** 🚀

When Supabase is ready, run this schema and VerChem will have full database support!
