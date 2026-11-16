// CloudFront Function (viewer-request): clean-URL rewriting for a Next.js
// static export served from a private S3 origin via OAC.
//
// Mirrors the nginx `try_files $uri $uri.html $uri/index.html` intent:
//   /something/        -> /something/index.html
//   /something         -> /something.html   (extension-less paths only)
//   /_next/static/x.js -> unchanged         (has an extension)
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (uri.lastIndexOf('.') < uri.lastIndexOf('/')) {
    // No dot after the last slash -> no file extension -> append .html
    request.uri = uri + '.html';
  }

  return request;
}
