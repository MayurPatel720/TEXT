export default function TestPage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1>✅ Vercel Deployment Test</h1>
      <p>If you can see this page, the deployment is working!</p>
      <ul>
        <li>Build: Success</li>
        <li>Route: /test</li>
        <li>Time: {new Date().toISOString()}</li>
      </ul>
    </div>
  );
}
