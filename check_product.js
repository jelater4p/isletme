import { createClient } from '@supabase/supabase-js';

// actually let's just pass the env vars directly to the script or read them manually

const supabaseUrl = 'https://kwrlpgrykpvayjuppmyr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3cmxwZ3J5a3B2YXlqdXBwbXlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjMwNTQsImV4cCI6MjA4NTIzOTA1NH0.xBEudYJZHUeWOl3L8-G_SrLpkNWBXX_9QTGdXSm2w4c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('name, category, price, stock');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('--- Products ---');
    data.forEach(p => {
        console.log(`- ${p.name} (${p.category}): ${p.price} TL [Stok: ${p.stock}]`);
    });

    const milkshake = data.find(p => p.name.toLowerCase().includes('milkshake'));
    if (milkshake) {
        console.log('\n✅ EVET! Milkshake bulundu!');
    } else {
        console.log('\n❌ Hayır, Milkshake listelenmedi.');
    }
}

checkProducts();
