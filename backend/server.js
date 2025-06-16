const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
require('dotenv').config();

const { initializeDatabase } = require('./database/init');
const postsRouter = require('./routes/posts');
const moderationRouter = require('./routes/moderation');

const app = new Hono();

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }
  
  await next();
});

app.get('/', (c) => {
  return c.json({ 
    message: 'AI Content Moderation System API',
    version: '1.0.0',
    endpoints: {
      posts: '/api/posts',
      moderation: '/api/moderation'
    }
  });
});

app.route('/api/posts', postsRouter);
app.route('/api/moderation', moderationRouter);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    serve({
      fetch: app.fetch,
      port: PORT,
    });
    
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();