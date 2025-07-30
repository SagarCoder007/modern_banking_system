const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function fixPasswords() {
    console.log('🔧 Fixing User Passwords...\n');
    
    try {
        // Hash the correct password
        const correctPassword = 'password123';
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(correctPassword, saltRounds);
        
        console.log('Generated hash:', hashedPassword);
        
        // Update all users with the correct password hash
        const [result] = await pool.execute(
            'UPDATE users SET password = ? WHERE username IN (?, ?, ?, ?)',
            [hashedPassword, 'banker1', 'customer1', 'customer2', 'customer3']
        );
        
        console.log(`✅ Updated ${result.affectedRows} user passwords`);
        
        // Test the password verification
        console.log('\n🧪 Testing password verification...');
        
        const [users] = await pool.execute('SELECT username, password FROM users');
        
        for (const user of users) {
            const isValid = await bcrypt.compare(correctPassword, user.password);
            console.log(`${user.username}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        }
        
        console.log('\n🎉 Password fix complete!');
        console.log('Now try logging in with:');
        console.log('- Customer: customer1 / password123');
        console.log('- Banker: banker1 / password123');
        
    } catch (error) {
        console.error('❌ Error fixing passwords:', error);
    } finally {
        process.exit(0);
    }
}

fixPasswords();