import { Client, Users } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://appwrite.agenc-ia.net/v1')
  .setProject('6aca50ed002f9c42bb62')
  .setKey('standard_f45d55cd5d302a9dc6926ffa773487ba6e7f295b06766c65454dbeeea84f2b9af680af9df2731167924713867cca46c6d818b872786cf38ae837d52fffac900562bf3ed1dd056011919207aa659398d6bf804cc5c8cf22f94c78f0d842220c36fffebc1f208b22dcb2c43a2d3d431bf58c0142dd92afb913feb33172afad1d96');

const users = new Users(client);

async function run() {
  const list = [
    { id: '3f86539a13224cddba613926be4515d7', email: 'celiogomesalves@gmail.com', name: 'Celio Gomes' },
    { id: 'cade7f1975534e8eaa165b116b9573f0', email: 'contato@osegredodoviajante.com', name: 'O Segredo do Viajante' }
  ];

  for (const u of list) {
    try {
      const res = await users.create(u.id, u.email, undefined, 'Mudar123!', u.name);
      console.log('User created:', res.$id, res.email);
    } catch(e) {
      console.log('User create note for', u.email, ':', e.message);
    }
  }
}

run();
