export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { 'Allow': 'POST' } });
  }

  const bucket = env.R2_IMAGES;
  const baseUrl = env.IMAGES_BASE_URL;
  if (!bucket || !baseUrl) {
    return new Response(
      'Missing R2 binding or base URL. Configure R2_IMAGES binding and IMAGES_BASE_URL environment variable.',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    return new Response('Invalid form data', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string' || !('name' in file)) {
    return new Response('A file field is required', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  const filename = file.name || 'upload';
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  const safeName = filename
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '') || 'file';
  const key = `${date}/${safeName}`;

  const contentType = file.type || 'application/octet-stream';

  try {
    await bucket.put(key, file.stream(), {
      httpMetadata: { contentType },
    });
  } catch (error) {
    return new Response(`Unable to upload file to R2: ${error.message}`, {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const publicUrl = `${normalizedBaseUrl}/${key}`;
  return new Response(JSON.stringify({ url: publicUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
