import { Client, Databases } from 'node-appwrite';
import https from 'https';

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvaHhncnlnam1ycHp3cXJvbGR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMyOTA5NywiZXhwIjoyMDkzOTA1MDk3fQ.ZFNCX4S4I5Yf1mDVd0TicKAymK1zWzAMuSIKAsPxBgQ';
const SUPABASE_HOST = 'sohxgrygjmrpzwqroldy.supabase.co';

const appwriteClient = new Client()
  .setEndpoint('https://appwrite.agenc-ia.net/v1')
  .setProject('6aca50ed002f9c42bb62')
  .setKey('standard_f45d55cd5d302a9dc6926ffa773487ba6e7f295b06766c65454dbeeea84f2b9af680af9df2731167924713867cca46c6d818b872786cf38ae837d52fffac900562bf3ed1dd056011919207aa659398d6bf804cc5c8cf22f94c78f0d842220c36fffebc1f208b22dcb2c43a2d3d431bf58c0142dd92afb913feb33172afad1d96');

const databases = new Databases(appwriteClient);
const DB_ID = '6aca50fd00207c788d40';

function fetchSupabaseData(table) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_HOST,
      path: `/rest/v1/${table}?select=*`,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Format document data for Appwrite
function prepareData(row, attributes) {
  const doc = {};
  const attrMap = new Map(attributes.map(a => [a.key, a]));

  for (const [key, value] of Object.entries(row)) {
    if (key === 'id') continue;
    const attr = attrMap.get(key);
    if (!attr) continue;

    if (value === null || value === undefined) {
      doc[key] = null;
      continue;
    }

    if (attr.type === 'string') {
      if (typeof value === 'object') {
        doc[key] = JSON.stringify(value);
      } else {
        doc[key] = String(value);
      }
    } else if (attr.type === 'datetime') {
      try {
        doc[key] = new Date(value).toISOString();
      } catch {
        doc[key] = null;
      }
    } else if (attr.type === 'integer') {
      doc[key] = parseInt(value, 10);
    } else if (attr.type === 'double') {
      doc[key] = parseFloat(value);
    } else if (attr.type === 'boolean') {
      doc[key] = Boolean(value);
    } else {
      doc[key] = value;
    }
  }

  return doc;
}

const tablesToMigrate = [
  'system_config',
  'user_roles',
  'fb_ads_config',
  'fb_campaigns',
  'fb_adsets',
  'fb_ads',
  'fb_metrics',
  'leads',
  'purchases',
  'lead_events',
  'invoice_requests'
];

async function migrate() {
  for (const table of tablesToMigrate) {
    console.log(`\n=== Migrating Table: ${table} ===`);
    try {
      const rows = await fetchSupabaseData(table);
      console.log(`Found ${rows.length} rows in Supabase`);
      if (rows.length === 0) continue;

      const col = await databases.getCollection(DB_ID, table);
      const attributes = col.attributes;

      let success = 0;
      let failed = 0;

      for (const row of rows) {
        const docId = row.id ? String(row.id).replace(/[^a-zA-Z0-9._-]/g, '') : undefined;
        const data = prepareData(row, attributes);

        try {
          await databases.createDocument(
            DB_ID,
            table,
            docId || 'unique()',
            data
          );
          success++;
        } catch (e) {
          if (e.code === 409) {
            // Already exists, update
            try {
              await databases.updateDocument(DB_ID, table, docId, data);
              success++;
            } catch (upErr) {
              failed++;
              console.error(`  x Update failed for ${docId}:`, upErr.message);
            }
          } else {
            failed++;
            console.error(`  x Create failed for ${docId}:`, e.message);
          }
        }
      }
      console.log(`Table ${table} done: ${success} success, ${failed} failed`);
    } catch (err) {
      console.error(`Error migrating ${table}:`, err.message);
    }
  }

  console.log('\nAll data migration completed!');
}

migrate();
