package com.test;

import java.io.ByteArrayOutputStream;
import java.util.Arrays;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.IdTokenCredentials;
import com.google.auth.oauth2.IdTokenProvider;
import com.google.auth.oauth2.ImpersonatedCredentials;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;

public class TestApp {
	public static void main(String[] args) {
		TestApp tc = new TestApp();
	}

	private static String targetServiceAccount = "target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com";
	private static String bucketName = "fabled-ray-104117-test";
	private static String projectID = "fabled-ray-104117";

	public TestApp() {
		try {

			GoogleCredentials sourceCredentials = GoogleCredentials.getApplicationDefault();
			ImpersonatedCredentials targetCredentials = ImpersonatedCredentials.create(sourceCredentials,
					targetServiceAccount, null, Arrays.asList("https://www.googleapis.com/auth/devstorage.read_only"),
					5);

			IdTokenCredentials tokenCredential = IdTokenCredentials.newBuilder().setIdTokenProvider(targetCredentials)
					.setTargetAudience("https://foo.bar")
					.setOptions(Arrays.asList(IdTokenProvider.Option.FORMAT_FULL, IdTokenProvider.Option.LICENSES_TRUE))
					.build();

			tokenCredential.refresh();
			System.out.println(tokenCredential.getAccessToken().getTokenValue());

			Storage storage = StorageOptions.newBuilder().setProjectId(projectID).setCredentials(targetCredentials)
					.build().getService();

			Blob blob = storage.get(BlobId.of(bucketName, "foo.txt"));
			ByteArrayOutputStream bout = new ByteArrayOutputStream();
			blob.downloadTo(bout);
			System.out.println(bout.toString());

		} catch (Exception ex) {
			System.out.println("Error:  " + ex.getMessage());
		}
	}

}
