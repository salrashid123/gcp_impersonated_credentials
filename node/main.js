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


  // now construct workaround to use GCS client library
  const oauth2Client = new OAuth2Client();

  oauth2Client.refreshHandler = async () => {
    const refreshedAccessToken = await targetClient.getAccessToken();
    return {
      access_token: refreshedAccessToken.token,
      expiry_date: refreshedAccessToken.expirationTime,
    };
  };

  // inject the oauth2client into the StorageOptions override
  // for the access_token and the sign() override as well
  const storageOptions = {
    projectId,
    authClient: {
      getCredentials: async () => {
        return {
          client_email: targetPrincipal
        }
      },
      request: opts => {
        return oauth2Client.request(opts);
      },
      sign: (blobToSign) => {
        return targetClient.sign(blobToSign);
      },
      authorizeRequest: async opts => {
        opts = opts || {};
        const url = opts.url || opts.uri;
        const headers = await oauth2Client.getRequestHeaders(url);
        opts.headers = Object.assign(opts.headers || {}, headers);
        return opts;
      },
    },
  };

  const storage = new Storage(storageOptions);

  // use the gcs client to get an object
  const file = storage.bucket(bucketName).file('foo.txt');
  await file.download(function (err, contents) {
    console.log("file err: " + err);
    console.log("file data: " + contents);
  });

  // now use the gcs client to sign a url
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + 10 * 60 * 1000,
  };

  const [signed_url] = await storage
    .bucket('fabled-ray-104117-test')
    .file('foo.txt')
    .getSignedUrl(options);
  console.log(signed_url)

  const authHeaders = await targetClient.getRequestHeaders();
  const url = 'https://storage.googleapis.com/storage/v1/b/' + bucketName + '/o/foo.txt'
  const resp = await targetClient.request({ url });
  console.log(resp.data);


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