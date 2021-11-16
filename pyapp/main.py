#!/usr/bin/python
from google.cloud import storage
import google.auth
from google.auth.transport import requests
from google.auth import impersonated_credentials
import google.api_core.exceptions


source_credentials, project_id = google.auth.default()

## project_id must be set manually for WIF
project_id = 'fabled-ray-104117'

bucket_name = project_id + '-test'
target_credentials = 'target-serviceaccount@{}.iam.gserviceaccount.com'.format(project_id)

target_scopes = ['https://www.googleapis.com/auth/devstorage.read_only']
target_credentials = impersonated_credentials.Credentials(
    source_credentials = source_credentials,
    target_principal=target_credentials,
    target_scopes = target_scopes,
    delegates=[],
    lifetime=500)

id_creds = impersonated_credentials.IDTokenCredentials(target_credentials, target_audience="https://foo.bar", include_email=True)
authed_session = requests.AuthorizedSession(target_credentials) 
request = google.auth.transport.requests.Request()
id_creds.refresh(request)
print(id_creds.token)


try:
  storage_client = storage.Client(project=project_id, credentials=target_credentials)
  bucket = storage_client.bucket(bucket_name)
  blob = bucket.get_blob('foo.txt')
  secret_data = blob.download_as_string()
  print(secret_data.decode('utf-8')) 
except google.api_core.exceptions.Forbidden as f:
  print("Forbidden " + str(f))
  pass