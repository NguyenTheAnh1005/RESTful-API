require('dotenv').config();

const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 3002}`;

(async () => {
  try {
    const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
    const body = await response.json();
    if (response.status !== 200 || body.status !== 'ok' || body.database !== 'up')
      throw new Error(`Health check returned ${response.status}`);
    console.log('Lab 2 API and PostgreSQL healthy');
  } catch (error) {
    console.error(`Lab 2 health check failed: ${error.message}`);
    process.exitCode = 1;
  }
})();
