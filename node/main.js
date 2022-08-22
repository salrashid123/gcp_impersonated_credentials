const { GoogleAuth, OAuth2Client, Impersonated, IdTokenClient } = require('google-auth-library');
const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
  
async function main() {

  const scopes = 'https://www.googleapis.com/auth/cloud-platform'

  // get source credentials
  const auth = new GoogleAuth({
    scopes: scopes
  });
  const client = await auth.getClient();

  // First impersonate
  let targetPrincipal = 'target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com'
  let targetClient = new Impersonated({
    sourceClient: client,
    targetPrincipal: targetPrincipal,
    lifetime: 30,
    delegates: [],
    targetScopes: [scopes]
  });

  let projectId = 'fabled-ray-104117'
  let bucketName = 'fabled-ray-104117-test'


  // use the impersonated creds to access secret manager
  // #######  SecretManager 
  var AuthClient = function (client) {
    this._client = client;
  };
  AuthClient.prototype.getClient = function () {
    return this._client;
  };
  var ac = new AuthClient(targetClient);

  const sm_client = new SecretManagerServiceClient({
    projectId: projectId,
    auth: ac,
  });
  const secret_name = 'projects/248066739582/secrets/my-secret/versions/1';
  const [accessResponse] = await sm_client.accessSecretVersion({
    name: secret_name,
  });

  const responsePayload = accessResponse.payload.data.toString('utf8');
  console.info(`Payload: ${responsePayload}`);


  // use the impersonated creds to access gcs
  const storageOptions = {
    projectId,
    authClient: targetClient,
  };

  const storage = new Storage(storageOptions);

  //#######  GCS   use the gcs client to get an object
  const file = storage.bucket(bucketName).file('foo.txt');
  await file.download(function (err, contents) {
    if (err) {
      console.log("file err: " + err);
    } else {
      console.log("file data: " + contents);
    }
  });

  const authHeaders = await targetClient.getRequestHeaders();
  const url = 'https://storage.googleapis.com/storage/v1/b/' + bucketName + '/o/foo.txt'
  const resp = await targetClient.request({ url });
  console.log(resp.data);

  // ####### GCS SignedURL
  // pending https://github.com/googleapis/google-auth-library-nodejs/issues/1443

  //console.log(await targetClient.sign("dfasa"));

  // const options = {
  //   version: 'v4',
  //   action: 'read',
  //   expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  // };

  // const  su = await storage
  //   .bucket(bucketName)
  //   .file('foo.txt')
  //   .getSignedUrl(options);

  // console.log(su);


  // #######  IDTOKEN // then get an ID Token
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