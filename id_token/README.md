### Getting GCP IDTokens using Workload Identity Federation

Snippets demonstrating how to get an `id_token` for the federated identity

Assume you have GCP WIF setup for oidc as shown here

* [Exchange Generic OIDC Credentials for GCP Credentials using GCP STS Service](https://github.com/salrashid123/gcpcompat-oidc)


First allow the mapped principal permissions to directly impersonate a given SA:

```bash
gcloud iam service-accounts add-iam-policy-binding     target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com  \
    --member='principal://iam.googleapis.com/projects/1071284184436/locations/global/workloadIdentityPools/oidc-pool-1/subject/alice@domain.com' \
	--role='roles/iam.serviceAccountTokenCreator'
```

in this case, federated token alice has is capable of directly getting an OIDC token for `target-serviceaccount`.

then if alice's  _original_ federating token is in the file `/tmp/oidccred.txt` and your the ADC config is:

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



enable ADC env var (`GOOGLE_APPLICATION_CREDENTIALS=/path/to/sts-creds.json`)

Then directly use the IAM API:

[https://cloud.google.com/iam/docs/reference/libraries](https://cloud.google.com/iam/docs/reference/libraries)


