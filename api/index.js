import Fastify from 'fastify'
import cors from '@fastify/cors';

const app = Fastify({
  logger: true,
})

// Register the CORS plugin
app.register(cors, {
  origin: '*', // Allow requests from any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type'], // Allowed headers
});

app.get('/healthCheck', async (req, reply) => {
  return reply.status(200).send({ message: "ALL OK!"})
})
app.get('/accessToken', async (req, reply) => {
  const code = req.query.code; // Capture the `code` from query parameters

  if (!code) {
    return reply.status(400).send('Missing "code" query parameter');
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', // GitHub expects this header to return JSON
      },
      body: JSON.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code: code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return reply.status(400).send({ error: data.error_description });
    }

    // Send the access token back to the client
    return reply.status(200).send({ token: data.access_token });

  } catch (error) {
    console.error('Error fetching access token:', error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

export default async function handler(req, reply) {
  await app.ready()
  app.server.emit('request', req, reply)
}
