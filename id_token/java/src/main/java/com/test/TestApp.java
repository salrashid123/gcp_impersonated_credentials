package com.test;

import com.google.cloud.iam.credentials.v1.GenerateIdTokenRequest;
import com.google.cloud.iam.credentials.v1.GenerateIdTokenResponse;
import com.google.cloud.iam.credentials.v1.IamCredentialsClient;
import com.google.cloud.iam.credentials.v1.ServiceAccountName;
public class TestApp {
	public static void main(String[] args) {
		TestApp tc = new TestApp();
	}

	private static String targetServiceAccount = "target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com";
	private static String audience = "https://foo.bar";

	public TestApp() {
		try {

			// GoogleCredentials sourceCredentials =
			// GoogleCredentials.getApplicationDefault();
			IamCredentialsClient iamCredentialsClient = IamCredentialsClient.create();

			String name = ServiceAccountName.of("-", targetServiceAccount).toString();

			GenerateIdTokenRequest request = GenerateIdTokenRequest.newBuilder().setName(name).setAudience(audience)
					.setIncludeEmail(true).build();
			GenerateIdTokenResponse response = iamCredentialsClient.generateIdToken(request);
			System.out.println("IDToken " + response.getToken());

		} catch (Exception ex) {
			System.out.println("Error:  " + ex.getMessage());
		}
	}

}
