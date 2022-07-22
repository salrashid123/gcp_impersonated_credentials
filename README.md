# Using ImpersonatedCredentials for Google Cloud APIs and IDTokens

Samples which demonstrate getting and using impersonated credentials for Google Cloud Service Accounts.  

Use the impersonated token to access GCP Services and IdTokens for Cloud Run, Cloud Functions, Endpoints



- Start with Service Account SA1
- Use SA1 to impersonate SA2
- Use SA2 to get an `id_token`
- Use SA2 to access a Google Cloud Storage object

See [Creating Short-Lived Service Account Credentials](https://cloud.google.com/iam/docs/creating-short-lived-service-account-credentials)

Note, if you use [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation), a type of first level impersonation is already done for you which means you can use [WIF to directly access GCP resources](https://cloud.google.com/iam/docs/configuring-workload-identity-federation#aws).  You can use the samples to chain impersonated credentials with WIF as well.

However, if you need to use the WIF identity to get an `id_token`, you still need to manually acquire that using one of the samples below

Also see:

* [Authenticating using Google OpenID Connect Tokens](https://github.com/salrashid123/google_id_token)
* [gRPC Authentication with Cloud Run](https://github.com/salrashid123/cloud_run_grpc_auth)
* [Vault Secrets Plugin for Service Account Impersonation, GCP OIDC and JWTAccess Tokens](https://github.com/salrashid123/vault-plugin-secrets-gcp)


## Usage

```bash
# Create source identity:
export PROJECT_ID=$(gcloud config list --format="value(core.project)")

gcloud iam service-accounts create source-serviceaccount --display-name="Source Identity"

gcloud iam service-accounts keys  create svc-src.json \
 --iam-account=source-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com

# Create target identity
gcloud iam service-accounts create target-serviceaccount --display-name="Target Identity"

# Allow source to impersonate target
gcloud iam service-accounts add-iam-policy-binding \
    target-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com  \
    --member=serviceAccount:source-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com \
    --role='roles/iam.serviceAccountTokenCreator'
```

For this repo we will primarily use the [Google Cloud Storage](https://cloud.google.com/storage/docs/reference/libraries) set of libraries (except in the node example set where we have to use [Secret Manager](https://cloud.google.com/secret-manager/docs) as well)

```bash
# Add resource ACL to target resource

## resource here is a gcs bucket
gsutil mb gs://$PROJECT_ID-test
echo -n bar > foo.txt
gsutil cp foo.txt gs://$PROJECT_ID-test/
rm foo.txt

gsutil iam ch serviceAccount:"target-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com":objectViewer  gs://$PROJECT_ID-test


## also secret manager (use for nodejs sample)
printf "s3cr3t" | gcloud secrets create my-secret --data-file=-    --replication-policy=user-managed --locations=us-central1,us-east1
export SECRET_NAME=`gcloud secrets describe my-secret --format="value(name)"`
echo $SECRET_NAME
gcloud secrets add-iam-policy-binding my-secret  \
    --member=serviceAccount:target-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
```


### gcloud

```bash
# activate the srouce account
gcloud auth activate-service-account --key-file=`pwd`/svc-src.json

### try source account (fail)
gcloud alpha storage ls gs://$PROJECT_ID-test

### try impersonated account (pass)
gcloud alpha storage ls gs://$PROJECT_ID-test --impersonate-service-account=target-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com
```

### gsutil

```bash
# activate the 'soruce'
gcloud auth activate-service-account --key-file=`pwd`/svc-src.json

# try with your service account
gsutil stat gs://$PROJECT_ID-test/foo.txt

# now use impersonation
gsutil -i target-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com stat gs://$PROJECT_ID-test/foo.txt
```

### bq

(not supported)

though you can use limited bq functions through gcloud right now and then use gcloud impersonation

```bash
 gcloud alpha bq jobs list
```

#### ADC

Tested with ADC variants:

* Service Account Credentials JSON

```bash
export GOOGLE_APPLICATION_CREDENTIALS=`pwd`/svc-src.json
```

```json
{
  "type": "service_account",
  "project_id": "$PROJECT_ID",
  "private_key_id": "da386aab2a4f793d14dc8c809c8f8180d86dfcb9",
  "private_key": "-----BEGIN PRIVATE KEY-----\nM",
  "client_email": "source-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com",
  "client_id": "100973668658833123774",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/source-serviceaccount%40$PROJECT_ID.iam.gserviceaccount.com"
}
```

- `golang`: pass

- `java`: pass

- `python`: pass

- `node`: pass

- `dotnet`: fail


#### Workload Identity Federation (OIDC)


* [Exchange Generic OIDC Credentials for GCP Credentials using GCP STS Service](https://github.com/salrashid123/gcpcompat-oidc)
* [Exchange AWS Credentials for GCP Credentials using GCP STS Service](https://github.com/salrashid123/gcpcompat-aws)

```bash
export GOOGLE_APPLICATION_CREDENTIALS=`pwd`/sts-creds.json
```

```json
{
  "type": "external_account",
  "audience": "//iam.googleapis.com/projects/1071284184436/locations/global/workloadIdentityPools/oidc-pool-1/providers/oidc-provider-1",
  "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
  "token_url": "https://sts.googleapis.com/v1/token",
  "credential_source": {
    "file": "/tmp/oidccred.txt"
  },
  "service_account_impersonation_url": "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/oidc-federated@$PROJECT_ID.iam.gserviceaccount.com:generateAccessToken"
}
```

in this case, `oidc-federated@$PROJECT_ID.iam.gserviceaccount.com` is allowed to impersonate `target-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com`

```bash
gcloud iam service-accounts add-iam-policy-binding \
    target-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com  \
    --member=serviceAccount:oidc-federated@$PROJECT_ID.iam.gserviceaccount.com \
    --role='roles/iam.serviceAccountTokenCreator'
```


- `golang`: pass

- `java`: pass

- `python`: pass*
  the `project_id` is not populated with WIF so you need to manually set it in the clients
  ```python
  source_credentials, project_id = google.auth.default()
  project_id = '$PROJECT_ID'
  storage_client = storage.Client(project=project_id, credentials=target_credentials)
  ```

- `node`: pass

- `dotnet`: fail

  ```
  ERROR: Error reading credential file from location /path/to/sts-creds.json: Error creating credential from JSON. Unrecognized credential type external_account
  ```


>> **NOTE:** if you just need an `id_token` for SA1 and workloadidentity, you can directly acquire that using the [IAMCredentials.generateIdToken](https://cloud.google.com/iam/docs/reference/credentials/rest/v1/projects.serviceAccounts/generateIdToken) API call.

However, to do that, you must NOT enable impersonation (`service_account_impersonation_url`) on the workload identity configuration:

For example, with OIDC federation, do not specify the `service_account_impersonation_url` parameter in the ADC config file

```json
{
  "type": "external_account",
  "audience": "//iam.googleapis.com/projects/1071284184436/locations/global/workloadIdentityPools/oidc-pool-1/providers/oidc-provider-1",
  "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
  "token_url": "https://sts.googleapis.com/v1/token",
  "credential_source": {
    "file": "/tmp/oidccred.txt"
  }
}
```

You can omit that parameter by not specifying `--service-account=` when creating a config (`gcloud beta iam workload-identity-pools create-cred-config`)

Since very specific APIs such as GCS and IAMCredentials API can _directly_ use federation without impersonation (see [Using Federated or IAM Tokens](https://github.com/salrashid123/gcpcompat-oidc#using-federated-or-iam-tokens)), you can apply the federated token to `generateIdToken`.

However, to do that, you must allow the federated identity to impersonate an SA.  In the following example, we're enabling the federated OIDC identity to directly impersonate:

```bash
gcloud iam service-accounts add-iam-policy-binding     target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com  \
    --member='principal://iam.googleapis.com/projects/1071284184436/locations/global/workloadIdentityPools/oidc-pool-1/subject/alice@domain.com' \
	--role='roles/iam.serviceAccountTokenCreator'
```

for more information, see 

* [Exchange Generic OIDC Credentials for GCP Credentials using GCP STS Service](https://github.com/salrashid123/gcpcompat-oidc)
* [Exchange AWS Credentials for GCP Credentials using GCP STS Service](https://github.com/salrashid123/gcpcompat-aws)

Once that's done, acquire the source federation credentials, (in the case of OIDC, its embedded in `/tmp/oidccred.txt` file above), then enable ADC env var (`GOOGLE_APPLICATION_CREDENTIALS=/path/to/sts-creds.json`)

and finally use the iam api:

```python
#!/usr/bin/python
from google.cloud import  iam_credentials_v1

project_id = 'fabled-ray-104117'
client = iam_credentials_v1.services.iam_credentials.IAMCredentialsClient()
target_credentials = 'target-serviceaccount@{}.iam.gserviceaccount.com'.format(project_id)
name = "projects/-/serviceAccounts/{}".format(target_credentials)
id_token = client.generate_id_token(name=name,audience='https://foo.bar', include_email=True)

print(id_token.token)
```

#### Compute Engine Credentials (metadata server)

```bash
curl -s -H 'Metadata-Flavor: Google' http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email
123456-compute@developer.gserviceaccount.com
```

in this case, `123456-compute@developer.gserviceaccount.com` is allowed to impersonate `target-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com`

```
gcloud iam service-accounts add-iam-policy-binding \
    target-serviceaccount@$PROJECT_ID.iam.gserviceaccount.com  \
    --member=serviceAccount:1071284184436-compute@developer.gserviceaccount.com \
    --role='roles/iam.serviceAccountTokenCreator'
```

- `golang`: pass

- `java`: pass

- `python`: pass

- `node`: pass

- `dotnet`:  fail

  ```
  $ dotnet run
  ERROR: Only ServiceAccountCredential and UserCredential support impersonation.
  ```

---

#### python

see:

- [google.auth.impersonated_credentials](https://google-auth.readthedocs.io/en/master/user-guide.html#impersonated-credentials)
- [google.auth IDTokenCredentials](https://google-auth.readthedocs.io/en/master/user-guide.html#identity-tokens)

#### golang

- [google.golang.org/api/idtoken](https://pkg.go.dev/google.golang.org/api/idtoken)
- [google.golang.org/api/impersonate](https://pkg.go.dev/google.golang.org/api/impersonate)

#### java

- [google-auth-java.ImpersonatedCredentials](https://github.com/googleapis/google-auth-library-java)

#### nodeJS

While [Impersonated Credentials Client](https://github.com/googleapis/google-auth-library-nodejs#impersonated-credentials-client) are already around, it is not supported in all gcp client libraries:

- [Allow setting authentication client for google-cloud libraries ](https://github.com/googleapis/google-auth-library-nodejs/issues/1210)
- [Impersonated credentials should implement IdTokenProvider interface](https://github.com/googleapis/google-auth-library-nodejs/issues/1318)


>> the workaround here is the same sample documented in the above git issues and within [node/README.md](node/README.md).




#### dotnet

- [Google.Apis.Auth.OAuth2.ImpersonatedCredentials](https://googleapis.dev/dotnet/Google.Apis.Auth/latest/api/Google.Apis.Auth.OAuth2.ImpersonatedCredential.html)
- [Google.Apis.Auth.OAuth2.OidcToken](https://googleapis.dev/dotnet/Google.Apis.Auth/latest/api/Google.Apis.Auth.OAuth2.OidcToken.html)

## Token Lifetime

Note that the API surface for `iamcredentials.*` describes a `lifetime` variable.  What that does is pretty self-explanatory in that it just limits the lifetime of the
derived `access_token`.  By default its one hour `3600s` but will automatically refresh even if the lifetime is set.  Effectively, the lifetime is there for the transient token
since its auto-refreshed on expiration. 

## Chained Delegation

Another feature with `iamcredentials.*` api suite is the `delegates` parameter.  What that signifies is the list of service accounts that *must* already have authorization to mint tokens on 
behalf of the successive account.  The chained list of delegates required to grant the final access_token.  If set, the sequence of identities must have `Service Account Token Creator` capability granted to the prceeding identity.  For example, if set to `[serviceAccountB, serviceAccountC]`, the `source_credential` must have the Token Creator role on `serviceAccountB`.  `serviceAccountB` must have the Token Creator on `serviceAccountC`.  Finally, `C` must have Token Creator on `target_principal`. If left unset, source_credential must have that role on target_principal.

For more information on this, see:

- [Creating Short-Lived Service Account Credentials](https://cloud.google.com/iam/docs/creating-short-lived-service-account-credentials)

## Chaining Credential Types

The examples above chain credentials for other credentials or `id_tokens`:

* `source->impersonated->gcp_service`
* `source->impersonated->id_token->cloud_run`

The more rare way to chain credentials is to use a [Downscoped Credential](https://cloud.google.com/iam/docs/downscoping-short-lived-credentials)

in this, the flow is

* `source->impersonated->downscoped_token->gcp_service(gcs)`

its not that common to do this type of chaining so i've left it out of this repo.  see example in go for [impersonate+downscope](https://gist.github.com/salrashid123/c894e3029be76243761709cf834c7ed1)

## AuditLogs

The following shows the audit logs that would get generated as a result of the Impersonated and Resource (GCS) access above:

- ![images/audit_log.png](images/audit_log.png)

Note that the logs span two different resource.types in Cloud logging (IAM and the resource in context).  That means to see them together, just run
a query with a filter like:


```
resource.type="service_account" OR resource.type="gcs_bucket"
```

Here is a detailed logging payload for the IAM request:

- ![images/get_credentials_request.png](images/get_credentials_request.png)

And the actual resource request.

- ![images/api_request.png](images/api_request.png)

Notice that the api request contains the **ORIGINAL** user that is impersonating the service account 

```json
    "authenticationInfo": {
      "principalEmail": "target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com",
      "serviceAccountDelegationInfo": [
        {
          "firstPartyPrincipal": {
            "principalEmail": "admin@esodemoapp2.com"
          }
        }
      ]
    },
```


For more information, see  [Audit logs for service accounts ](https://cloud.google.com/iam/docs/audit-logging/examples-service-accounts#auth-as-service-account)


### References

* [Exchange Generic OIDC Credentials for GCP Credentials using GCP STS Service](https://github.com/salrashid123/gcpcompat-oidc)
* [Exchange AWS Credentials for GCP Credentials using GCP STS Service](https://github.com/salrashid123/gcpcompat-aws)
* [Google Cloud Storage SignedURL with Cloud Run, Cloud Functions and GCE VMs](https://github.com/salrashid123/gcs_signedurl)
- [Hasicorp Vault: Support Service Account Impersonation](https://github.com/hashicorp/vault-plugin-secrets-gcp/issues/99)
