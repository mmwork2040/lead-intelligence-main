import { Client, Databases, Permission, Role } from 'node-appwrite';
import fs from 'fs';

const client = new Client()
  .setEndpoint('https://appwrite.agenc-ia.net/v1')
  .setProject('6aca50ed002f9c42bb62')
  .setKey('standard_f45d55cd5d302a9dc6926ffa773487ba6e7f295b06766c65454dbeeea84f2b9af680af9df2731167924713867cca46c6d818b872786cf38ae837d52fffac900562bf3ed1dd056011919207aa659398d6bf804cc5c8cf22f94c78f0d842220c36fffebc1f208b22dcb2c43a2d3d431bf58c0142dd92afb913feb33172afad1d96');

const databases = new Databases(client);
const DB_ID = '6aca50fd00207c788d40';

const defs = JSON.parse(fs.readFileSync('scratch_supabase_schema.json', 'utf8'));

// Collections and their attribute definitions
async function createSchema() {
  const existingCollections = await databases.listCollections(DB_ID);
  const existingMap = new Set(existingCollections.collections.map(c => c.$id));

  for (const [table, spec] of Object.entries(defs)) {
    if (table.startsWith('view_')) continue;

    console.log(`\n--- Setting up Collection: ${table} ---`);
    if (!existingMap.has(table)) {
      try {
        await databases.createCollection(
          DB_ID,
          table,
          table,
          [
            Permission.read(Role.any()),
            Permission.create(Role.any()),
            Permission.update(Role.any()),
            Permission.delete(Role.any()),
          ]
        );
        console.log(`[Created Collection] ${table}`);
      } catch (e) {
        console.error(`Error creating collection ${table}:`, e.message);
        continue;
      }
    } else {
      console.log(`[Collection Exists] ${table}`);
    }

    // Get existing attributes
    const colInfo = await databases.getCollection(DB_ID, table);
    const existingAttrs = new Set(colInfo.attributes.map(a => a.key));

    const props = spec.properties || {};
    for (const [colName, colSpec] of Object.entries(props)) {
      if (colName === 'id') continue; // Appwrite uses $id for documents
      if (existingAttrs.has(colName)) continue;

      const type = colSpec.type;
      const format = colSpec.format || '';
      const desc = colSpec.description || '';

      try {
        if (type === 'boolean') {
          await databases.createBooleanAttribute(DB_ID, table, colName, false);
          console.log(`  + bool: ${colName}`);
        } else if (type === 'integer') {
          await databases.createIntegerAttribute(DB_ID, table, colName, false);
          console.log(`  + int: ${colName}`);
        } else if (type === 'number') {
          await databases.createFloatAttribute(DB_ID, table, colName, false);
          console.log(`  + float: ${colName}`);
        } else if (type === 'array') {
          await databases.createStringAttribute(DB_ID, table, colName, 255, false, undefined, true);
          console.log(`  + string[]: ${colName}`);
        } else if (type === 'undefined' || desc.includes('jsonb') || format.includes('json')) {
          // JSON string
          await databases.createStringAttribute(DB_ID, table, colName, 100000, false);
          console.log(`  + json(string): ${colName}`);
        } else if (format.includes('date') || format.includes('time')) {
          // Datetime
          await databases.createDatetimeAttribute(DB_ID, table, colName, false);
          console.log(`  + datetime: ${colName}`);
        } else {
          // String
          const size = (colName === 'notes' || colName === 'description' || colName === 'error_message' || colName === 'metadata' || colName === 'access_token') ? 10000 : 255;
          await databases.createStringAttribute(DB_ID, table, colName, size, false);
          console.log(`  + string(${size}): ${colName}`);
        }

        // Small delay to let Appwrite process attribute
        await new Promise(r => setTimeout(r, 200));
      } catch (attrErr) {
        console.error(`  x Failed attribute ${table}.${colName}:`, attrErr.message);
      }
    }
  }

  console.log('\nAll collections and attributes created successfully!');
}

createSchema();
