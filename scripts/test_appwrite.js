import { Client, Databases, Permission, Role } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://appwrite.agenc-ia.net/v1')
  .setProject('6aca50ed002f9c42bb62')
  .setKey('standard_f45d55cd5d302a9dc6926ffa773487ba6e7f295b06766c65454dbeeea84f2b9af680af9df2731167924713867cca46c6d818b872786cf38ae837d52fffac900562bf3ed1dd056011919207aa659398d6bf804cc5c8cf22f94c78f0d842220c36fffebc1f208b22dcb2c43a2d3d431bf58c0142dd92afb913feb33172afad1d96');

const databases = new Databases(client);

async function test() {
  try {
    const res = await databases.listCollections('6aca50fd00207c788d40');
    console.log('Appwrite SDK collections:', res.total);
  } catch (err) {
    console.error('Appwrite SDK error:', err.message);
  }
}

test();
