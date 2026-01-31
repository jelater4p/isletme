// Helper to get consistent images based on product name or category
// Used as fallback until user uploads their own images to Supabase

const IMAGE_MAP = {
    // Specific Products
    'latte': 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=300&q=80',
    'americano': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80',
    'çay': 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?auto=format&fit=crop&w=300&q=80',
    'türk kahvesi': 'https://images.unsplash.com/photo-1515286576885-3b1a207212f0?auto=format&fit=crop&w=300&q=80',
    'cheesecake': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80',
    'tiramisu': 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=300&q=80',

    // Categories
    'kahve': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80',
    'tatlı': 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=300&q=80',
    'sıcak içecek': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=300&q=80',
    'soğuk içecek': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80',

    // Default
    'default': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80'
};

export const getProductImage = (product) => {
    // 1. If product has direct image_url from DB, use it
    if (product.image_url) return product.image_url;

    const nameLower = product.name?.toLowerCase() || '';
    const catLower = product.category?.toLowerCase() || '';

    // 2. Check for exact name match logic
    for (const [key, url] of Object.entries(IMAGE_MAP)) {
        if (nameLower.includes(key)) return url;
    }

    // 3. Check category match
    for (const [key, url] of Object.entries(IMAGE_MAP)) {
        if (catLower.includes(key)) return url;
    }

    // 4. Default
    return IMAGE_MAP['default'];
};
