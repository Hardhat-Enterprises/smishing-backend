// Example threat intelligence page output for CISA feed awareness.
export const getCisaFeedExample = async (req, res) => {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CISA Threat Intelligence Example</title>
  <style>body{font-family:system-ui, sans-serif;max-width:780px;margin:2rem auto;padding:1rem;color:#111;background:#f9fafb;}h1{color:#0b3d91;}code{background:#eef2ff;padding:0.2rem 0.4rem;border-radius:4px;}</style>
</head>
<body>
  <h1>CISA Threat Intelligence Example</h1>
  <p>This endpoint shows a simple example page for the CISA threat feed.</p>
  <p>Use this page as a reference for integrating CISA alerts into your security dashboard.</p>
  <h2>Sample data</h2>
  <ul>
    <li><strong>Title:</strong> <code>CISA Known Exploited Vulnerabilities Catalog</code></li>
    <li><strong>Source:</strong> <a href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog" target="_blank" rel="noreferrer">cisa.gov</a></li>
    <li><strong>Example alert:</strong> <code>2026-05-14 - Critical RCE vulnerability in vendor X</code></li>
  </ul>
  <h2>How to use</h2>
  <p>Call <code>GET /api/threat-intel/cisa</code> to see this page.</p>
  <p>In a production system, this page would be backed by the live CISA feed or threat intelligence API.</p>
</body>
</html>`;

    return res.status(200).type("html").send(html);
};
