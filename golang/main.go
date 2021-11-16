package main

import (
	"context"
	"io"
	"log"
	"os"

	"cloud.google.com/go/storage"
	"google.golang.org/api/impersonate"
	"google.golang.org/api/option"
)

/*
 export GOOGLE_APPLICATION_CREDENTIALS=`pwd`/svc-src.json
*/
var ()

const (
	bucketName           = "fabled-ray-104117-test"
	targetServiceAccount = "target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com"
)

func main() {
	ctx := context.Background()

	impersonatedTS, err := impersonate.CredentialsTokenSource(ctx, impersonate.CredentialsConfig{
		TargetPrincipal: targetServiceAccount,
		Scopes:          []string{storage.ScopeReadOnly},
	})
	if err != nil {
		log.Fatalf("%v", err)
	}

	idTokenSource, err := impersonate.IDTokenSource(ctx,
		impersonate.IDTokenConfig{
			TargetPrincipal: targetServiceAccount,
			Audience:        "https://foo.bar",
			IncludeEmail:    true,
		},
	)
	if err != nil {
		log.Fatalf("%v", err)
	}

	tok, err := idTokenSource.Token()
	if err != nil {
		log.Fatalf("%v", err)
	}

	log.Printf("IDToken: %s", tok.AccessToken)

	storageClient, err := storage.NewClient(ctx, option.WithTokenSource(impersonatedTS))
	if err != nil {
		log.Fatalf("%v", err)
	}
	bkt := storageClient.Bucket(bucketName)
	obj := bkt.Object("foo.txt")
	r, err := obj.NewReader(ctx)
	if err != nil {
		log.Fatalf("%v", err)
	}
	defer r.Close()
	if _, err := io.Copy(os.Stdout, r); err != nil {
		log.Fatalf("%v", err)
	}
}
