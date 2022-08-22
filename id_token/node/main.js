
const {GoogleAuth, Impersonated, IdTokenClient} = require('google-auth-library');

async function main() {

  const targetCredentials = 'target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com'

  const scopes = 'https://www.googleapis.com/auth/cloud-platform'
  const auth =  new GoogleAuth({
      scopes: scopes
  });
  const client = await auth.getClient();

  // First impersonate
  let targetClient = new Impersonated({
      sourceClient: client,
      targetPrincipal: targetCredentials,
      lifetime: 30,
      delegates: [],
      targetScopes: [scopes]
  });

  // then get an ID Token
  let idClient = new IdTokenClient({
      targetAudience: 'https://foo.bar',
      idTokenProvider: targetClient
  })

  const res = await idClient.request({
      method: 'GET',
      url: 'https://httpbin.org/get',
    });
  console.log(res.data);

}

main().catch(console.error);