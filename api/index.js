import Fastify from 'fastify';
import https from 'https';

const app = Fastify({
  logger: true,
})

app.get('/healthCheck', async (req, reply) => {
  return reply.status(200).send({ message: "ALL OK!"})
})
app.get('/accessToken', async (req, reply) => {
  try {
    const code = req?.query?.code; // Capture the `code` from query parameters
    console.log('code:', code);
    console.log('env:', process.env);

    if (!code) {
      return reply.status(400).send({ error: 'Missing "code" query parameter' });
    }

    const postData = JSON.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
    });

    console.log(postData);

    const options = {
      hostname: 'github.com',
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', // GitHub expects this header to return JSON
        'Content-Length': postData.length,
      },
    };

    console.log(options);

    const fetchAccessToken = () =>
        new Promise((resolve, reject) => {
          const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
              console.log('on:Data', chunk);
              data += chunk;
            });

            res.on('end', () => {
              try {
                console.log('on:End:beforeParse');
                const parsedData = JSON.parse(data);
                console.log('on:End:afterParse', parsedData);
                if (parsedData.error) {
                  console.log('on:End:error',parsedData?.error);
                  reject(parsedData.error_description);
                } else {
                  console.log('on:End:accessToken')
                  resolve(parsedData.access_token);
                }
              } catch (e) {
                console.log('on:End:catch', e?.message, e?.stack, e);
                reject('Error parsing response');
              }
            });
          });

          req.on('error', (error) => {
            console.log('on:Error', error?.message, error?.stack, error);
            reject(error);
          });

          console.log('postData', postData);
          req.write(postData);
          req.end();
        });

    console.log('before fetch');
    const token = await fetchAccessToken();

    console.log('after fetch', token);
    // Send the access token back to the client
    return reply.status(200).send({ token });

  } catch (error) {
    console.error('Error fetching access token:', error?.message, error?.stack, error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});
export default async function handler(req, reply) {
  await app.ready()
  app.server.emit('request', req, reply)
}
