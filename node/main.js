

const { GoogleAuth, IdTokenClient, IdTokenOptions, IdTokenProvider, Impersonated } = require('google-auth-library');
const { Storage } = require('@google-cloud/storage');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
  
async function main() {

    const scopes = 'https://www.googleapis.com/auth/cloud-platform'
    const auth =  new GoogleAuth({
        scopes: scopes
    });
    const client = await auth.getClient();

    // First impersonate
    let targetCredentials = 'target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com'
    let targetClient = new Impersonated({
        sourceClient: client,
        targetPrincipal: targetCredentials,
        lifetime: 30,
        delegates: [],
        targetScopes: [scopes]
    });

    // For id_tokens, see
    // - [Impersonated credentials should implement IdTokenProvider interface](https://github.com/googleapis/google-auth-library-nodejs/issues/1318)
    
    // cp patch/* node_modules/google-auth-library/build/src/auth/
    // let idClient = new IdTokenClient({
    //     targetAudience: 'https://foo.bar',
    //     idTokenProvider: targetClient
    // })

    // const res = await idClient.request({
    //     method: 'GET',
    //     url: 'https://httpbin.org/get',
    //   });
    // console.log(res.data);



    // then use the impersonated creds to access secret manager
    let projectId = 'fabled-ray-104117'

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

    // however, GCS clients do not directly support impersonated credentials
    // - [Allow setting authentication client for google-cloud libraries ](https://github.com/googleapis/google-auth-library-nodejs/issues/1210)

    // let bucketName = 'fabled-ray-104117-test'
    // let storage = new Storage({
    //     projectId: projectId,
    //     auth: ac,
    // });

    // const file = storage.bucket(bucketName).file('foo.txt');

    // file.download(function (err, contents) {
    //     console.log("file err: " + err);
    //     console.log("file data: " + contents);
    // });

    // nor generating signed using 
    // const options = {
    //     version: 'v4',
    //     action: 'read',
    //     expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    // };

    // let storage = new Storage({
    //     projectId:  'fabled-ray-104117',
    //     auth: ac,
    // });

    // const [url] = await storage
    //     .bucket('fabled-ray-104117-test')
    //     .file('foo.txt')
    //     .getSignedUrl(options);
    // console.log(url)

    // but the4 following does using raw request
    // const authHeaders = await targetClient.getRequestHeaders();
    // const url = 'https://storage.googleapis.com/storage/v1/b/' + bucketName + '/o/foo.txt'
    // const resp = await targetClient.request({ url });
    // console.log(resp.data);
}

main().catch(console.error);