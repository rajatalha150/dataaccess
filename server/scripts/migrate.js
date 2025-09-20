const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query, initializeDatabase } = require('../config/database');
require('dotenv').config();

const runMigration = async () => {
  try {
    console.log('🚀 Starting database migration...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found at: ' + schemaPath);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        try {
          await query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (err) {
          // Ignore "already exists" errors
          if (err.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
          } else {
            throw err;
          }
        }
      }
    }
    
    // Create initial admin user
    await createAdminUser();
    
    console.log('✅ Database migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

const createAdminUser = async () => {
  try {
    console.log('👤 Creating initial admin user...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@visionmediahub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Check if admin user already exists
    const existingAdmin = await query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists');
      return;
    }
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    
    // Create admin user
    const result = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email
    `, [adminEmail, passwordHash, 'Admin', 'User', 'admin', true]);
    
    const adminUser = result.rows[0];
    
    // Grant all permissions to admin
    const permissions = [
      'admin.full_access',
      'users.create',
      'users.read',
      'users.update',
      'users.delete',
      'media.create',
      'media.read',
      'media.update',
      'media.delete',
      'folders.create',
      'folders.read',
      'folders.update',
      'folders.delete',
      'system.settings'
    ];
    
    for (const permission of permissions) {
      await query(`
        INSERT INTO user_permissions (user_id, permission, resource_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, permission, resource_type, resource_id) DO NOTHING
      `, [adminUser.id, permission, 'system']);
    }
    
    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('⚠️  Please change the admin password after first login!');
    
  } catch (err) {
    console.error('❌ Failed to create admin user:', err.message);
    throw err;
  }
};

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Migration failed:', err);
      process.exit(1);
    });
}

module.exports = { runMigration, createAdminUser };