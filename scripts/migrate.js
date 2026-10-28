import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not set in environment variables.');
  process.exit(1);
}

const sql = postgres(connectionString, {
  onnotice: () => {}, // Suppress server notices (e.g. "relation already exists, skipping")
});

async function migrate() {
  try {
    console.log('Starting database migration...');

    // 1. Create enum 'transaction_type' if it doesn't already exist
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
          CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
        END IF;
      END $$;
    `;
    console.log("Verified enum 'transaction_type'.");

    // 2. Create 'categories' table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(50) NOT NULL,
        type transaction_type NOT NULL,
        icon VARCHAR(30),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log("Verified table 'categories'.");

    // 3. Create 'transactions' table
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        amount_cents INTEGER NOT NULL,
        type transaction_type NOT NULL,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log("Verified table 'transactions'.");

    // 4. Seed default categories
    const defaultCategories = [
      { name: 'Salary', type: 'INCOME', icon: 'cash' },
      { name: 'Freelance', type: 'INCOME', icon: 'briefcase' },
      { name: 'Groceries', type: 'EXPENSE', icon: 'shopping-cart' },
      { name: 'Dining', type: 'EXPENSE', icon: 'utensils' },
    ];

    for (const category of defaultCategories) {
      await sql`
        INSERT INTO categories (name, type, icon)
        SELECT ${category.name}, ${category.type}::transaction_type, ${category.icon}
        WHERE NOT EXISTS (
          SELECT 1 FROM categories WHERE name = ${category.name} AND type = ${category.type}::transaction_type
        );
      `;
    }
    console.log('Seeded default categories.');

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

migrate();
