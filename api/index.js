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
    const code = req.query.code; // Capture the `code` from query parameters

    if (!code) {
      return reply.status(400).send({ error: 'Missing "code" query parameter' });
    }

    const postData = JSON.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
    });

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

    const fetchAccessToken = () =>
        new Promise((resolve, reject) => {
          const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
              data += chunk;
            });

            res.on('end', () => {
              try {
                const parsedData = JSON.parse(data);
                if (parsedData.error) {
                  reject(parsedData.error_description);
                } else {
                  resolve(parsedData.access_token);
                }
              } catch (e) {
                reject('Error parsing response');
              }
            });
          });

          req.on('error', (error) => {
            reject(error);
          });

          req.write(postData);
          req.end();
        });

    const token = await fetchAccessToken();

    // Send the access token back to the client
    return reply.status(200).send({ token });

  } catch (error) {
    console.error('Error fetching access token:', error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});
export default async function handler(req, reply) {
  await app.ready()
  app.server.emit('request', req, reply)
}
