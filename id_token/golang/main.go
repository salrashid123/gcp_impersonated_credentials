package main

import (
	"context"
	"log"

	credentials "cloud.google.com/go/iam/credentials/apiv1"
	credentialspb "google.golang.org/genproto/googleapis/iam/credentials/v1"
)

var ()

const ()

/*
gcloud iam service-accounts add-iam-policy-binding     target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com  \
    --member='principal://iam.googleapis.com/projects/1071284184436/locations/global/workloadIdentityPools/oidc-pool-1/subject/alice@domain.com' \
	--role='roles/iam.serviceAccountTokenCreator'

export GOOGLE_APPLICATION_CREDENTIALS=`pwd`/sts-creds.json

$ more sts-creds.json
{
  "type": "external_account",
  "audience": "//iam.googleapis.com/projects/1071284184436/locations/global/workloadIdentityPools/oidc-pool-1/providers/oidc-provider-1",
  "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
  "token_url": "https://sts.googleapis.com/v1/token",
  "credential_source": {
    "file": "/tmp/oidccred.txt"
  }
}

*/
func main() {
	ctx := context.Background()

	c, err := credentials.NewIamCredentialsClient(ctx)
	if err != nil {
		log.Fatalf("%v", err)
	}
	defer c.Close()

	req := &credentialspb.GenerateIdTokenRequest{
		Name:         "projects/-/serviceAccounts/target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com",
		Audience:     "https://foo.bar",
		IncludeEmail: true,
	}
	resp, err := c.GenerateIdToken(ctx, req)
	if err != nil {
		log.Fatalf("%v", err)
	}

	log.Printf("IdToken %v", resp.Token)

}
