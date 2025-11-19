export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Next.js + Express + MySQL (Docker)</h1>
      <p>Frontend running. Backend health at: {process.env.NEXT_PUBLIC_API_BASE_URL}/api/health</p>
    </main>
  );
}
