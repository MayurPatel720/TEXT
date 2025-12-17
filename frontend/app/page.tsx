export const dynamic = 'force-static';

export default function RootPage() {
  return (
    <html>
      <body>
        <h1>Vercel Test - Root Page Works!</h1>
        <p>If you see this, the deployment is working.</p>
        <p>Time: {new Date().toISOString()}</p>
      </body>
    </html>
  );
}
