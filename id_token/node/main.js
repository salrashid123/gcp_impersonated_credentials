
const { IAMCredentialsClient } = require('@google-cloud/iam-credentials');

async function main() {

  const targetCredentials = 'target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com'

  const iam_client = new IAMCredentialsClient();
  const [resp] = await iam_client.generateIdToken({
    name: `projects/-/serviceAccounts/${targetCredentials}`,
    audience: 'https://foo.bar',
    includeEmail: true
  });
  console.info(resp.token);



}

main().catch(console.error);