import fs from 'fs/promises';

async function migrate() {
    const rawData = await fs.readFile('./db.json', 'utf-8');
    const data = JSON.parse(rawData);

    let sql = `
CREATE TABLE IF NOT EXISTS products (
    idx INTEGER PRIMARY KEY,
    id TEXT UNIQUE,
    type TEXT,
    title TEXT,
    cover TEXT,
    pages INTEGER,
    theme TEXT,
    tech JSONB,
    price NUMERIC,
    description TEXT,
    status TEXT,
    isHot BOOLEAN,
    hasInteraction BOOLEAN,
    createdAt TIMESTAMP WITH TIME ZONE,
    updatedAt TIMESTAMP WITH TIME ZONE,
    images JSONB,
    soldTo JSONB
);
`;

    for (const p of data.products) {
        sql += `
INSERT INTO products (idx, id, type, title, cover, pages, theme, tech, price, description, status, isHot, hasInteraction, createdAt, updatedAt, images, soldTo)
VALUES (
    ${p.idx}, 
    '${p.id}', 
    '${p.type || ''}', 
    '${p.title.replace(/'/g, "''")}', 
    '${p.cover ? p.cover.substring(0, 100) : ''}', 
    ${p.pages}, 
    '${p.theme}', 
    '${JSON.stringify(p.tech)}'::jsonb, 
    ${p.price || 'NULL'}, 
    '${p.description.replace(/'/g, "''")}', 
    '${p.status}', 
    ${p.isHot}, 
    ${p.hasInteraction || 'NULL'}, 
    '${p.createdAt}', 
    '${p.updatedAt}', 
    '${JSON.stringify(p.images || [])}'::jsonb, 
    '${JSON.stringify(p.soldTo || [])}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    soldTo = EXCLUDED.soldTo;
`;
    }

    await fs.writeFile('./migrate.sql', sql);
    console.log('SQL migration file created: migrate.sql');
}

migrate().catch(console.error);
