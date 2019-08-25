// import dependency from vendor.
import { serve } from './vendor/https/deno.land/std/http/server.ts';

const body = new TextEncoder().encode('Hello World\n');
const s = serve(':8000');
window.onload = async () => {
  console.log('http://localhost:8000/');
  for await (const req of s) {
    req.respond({ body });
  }
};
