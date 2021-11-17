using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;

using Google.Apis.Auth;
using Google.Apis.Http;
using Google.Apis.Auth.OAuth2;
using System.Net.Http;
using System.Net.Http.Headers;
using Google.Cloud.Iam.Credentials.V1;

// ERROR: Error reading credential file from location /home/srashid/Desktop/gcp_impersonated_credentials/sts-creds.json: Error creating credential from JSON. Unrecognized credential type external_account.
// Please check the value of the Environment Variable GOOGLE_APPLICATION_CREDENTIALS

namespace Program
{
    public class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                //Google.ApplicationContext.RegisterLogger(new ConsoleLogger(LogLevel.All, true));
                new Program().Run().Wait();
            }
            catch (AggregateException ex)
            {
                foreach (var err in ex.InnerExceptions)
                {
                    Console.WriteLine("ERROR: " + err.Message);
                }
            }
        }

        public async Task<string> Run()
        {
            string targetAudience = "https://foo.bar";
            string targetPrincipal = "target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com";

            GoogleCredential sourceCredential = await GoogleCredential.GetApplicationDefaultAsync();

            IAMCredentialsClient client = IAMCredentialsClient.Create();
            GenerateIdTokenResponse resp = client.GenerateIdToken(new GenerateIdTokenRequest()
            {
                Name = "projects/-/serviceAccounts/" + targetPrincipal,
                Audience = targetAudience,
                IncludeEmail = true
            });

            Console.WriteLine("ID TOken " + resp.Token);
            return null;
        }
    }
}

