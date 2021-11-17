#!/usr/bin/python
from google.auth import credentials
from google.cloud import  iam_credentials_v1

import google.auth
from google.auth.transport import requests


project_id = 'fabled-ray-104117'

client = iam_credentials_v1.services.iam_credentials.IAMCredentialsClient()

target_credentials = 'target-serviceaccount@{}.iam.gserviceaccount.com'.format(project_id)

name = "projects/-/serviceAccounts/{}".format(target_credentials)
id_token = client.generate_id_token(name=name,audience='https://foo.bar', include_email=True)

print(id_token.token)

