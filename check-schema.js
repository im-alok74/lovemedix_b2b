const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('Tables:', tables.map(t => t.table_name).join(', '));

  for (const table of ['users', 'medicines', 'orders', 'order_items', 'pharmacy_profiles', 'distributor_profiles', 'pharmacy_inventory', 'sessions', 'purchase_requests', 'out_of_stock_requests', 'cart_items', 'reviews', 'prescriptions', 'addresses', 'settings', 'medicine_images', 'categories', 'order_status_history']) {
    try {
      const cols = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = ${table} ORDER BY ordinal_position`;
      console.log('\n' + table + ':');
      cols.forEach(c => console.log('  ' + c.column_name + ' (' + c.data_type + ') ' + (c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL')));
    } catch(e) {
      console.log('\n' + table + ': NOT FOUND');
    }
  }
})();
