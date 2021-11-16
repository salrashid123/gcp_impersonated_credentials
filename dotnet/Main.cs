using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;

using Google.Apis.Auth;
using Google.Apis.Http;
using Google.Apis.Auth.OAuth2;
using System.Net.Http;
using System.Net.Http.Headers;
using Google.Apis.Storage.v1.Data;
using Google.Cloud.Storage.V1;
using Google.Apis.Logging;
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
            string uri = "https://httpbin.org/get";
            string targetPrincipal = "target-serviceaccount@fabled-ray-104117.iam.gserviceaccount.com";

            GoogleCredential sourceCredential = await GoogleCredential.GetApplicationDefaultAsync();

            var impersonatedCredential = sourceCredential.Impersonate(new ImpersonatedCredential.Initializer(targetPrincipal)
            {
                DelegateAccounts = new string[] { },
                Scopes = new string[] { "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/cloud-platform" },
                Lifetime = TimeSpan.FromHours(1)
            });


            string bucketName = "fabled-ray-104117-test";
            var storage = StorageClient.Create(impersonatedCredential);
            storage.DownloadObject(bucketName, "foo.txt", Console.OpenStandardOutput());
            Console.WriteLine();


            OidcToken oidcToken = await impersonatedCredential.GetOidcTokenAsync(OidcTokenOptions.FromTargetAudience(targetAudience).WithTokenFormat(OidcTokenFormat.Standard)).ConfigureAwait(false);
            string token = await oidcToken.GetAccessTokenAsync().ConfigureAwait(false);
            using (var httpClient = new HttpClient())
            {
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
                string response = await httpClient.GetStringAsync(uri).ConfigureAwait(false);
                Console.WriteLine(response);
                return response;
            }

        }
    }
}

