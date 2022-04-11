
### Node JS `id_tokens` and signedURL through impersonated credentials impersonated 

Requires changes to  `node_modules/google-auth-library/build/src/auth/impersonated.js`

* add function `fetchIdToken`: used to impersonate and then get id_token
* add function `sign`:  used to impersonate and then signURL

```javascript
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.Impersonated = void 0;
const oauth2client_1 = require("./oauth2client");
class Impersonated extends oauth2client_1.OAuth2Client {
  // ...
  // ..

     /**
     * Fetches an ID token.
     * @param targetAudience the audience for the fetched ID token.
     */
    async fetchIdToken(targetAudience) {

        try {
            await this.sourceClient.getAccessToken();
            const name = 'projects/-/serviceAccounts/' + this.targetPrincipal;
            const u = `${this.endpoint}/v1/${name}:generateIdToken`;
            const body = {
                delegates: this.delegates,
                audience: targetAudience,
                includeEmail: true,
            };
            const res = await this.sourceClient.request({
                url: u,
                data: body,
                method: 'POST',
            });
            const tokenResponse = res.data;

            return tokenResponse.token
        }
        catch (error) {
            error.message = `unable to impersonate: ${error}`;
            throw error;
        }
    }

    /**
     * Signs some bytes.
     * @param blobToSign Sign bytes.
     */
    async sign(blobToSign) {
        try {
            await this.sourceClient.getAccessToken();
            const name = 'projects/-/serviceAccounts/' + this.targetPrincipal;
            const u = `${this.endpoint}/v1/${name}:signBlob`;
            const body = {
                payload: Buffer.from(blobToSign).toString('base64')
            };
            const res = await this.sourceClient.request({
                url: u,
                data: body,
                method: 'POST',
            });
            const tokenResponse = res.data;
            return tokenResponse.signedBlob
        }
        catch (error) {
            error.message = `unable to impersonate: ${error}`;
            throw error;
        }
    }

}
exports.Impersonated = Impersonated;
//# sourceMappingURL=impersonated.js.map
```