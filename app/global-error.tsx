"use client"; // Error boundaries must be Client Components

// Replaces the root layout when the layout itself fails, so it brings its own
// <html> and <body> and cannot rely on the app's styles or components.
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          margin: 0,
          display: "grid",
          placeContent: "center",
          gap: "1rem",
          textAlign: "center",
        }}
      >
        <title>Algo deu errado | Painel CRM</title>
        <h1 style={{ margin: 0 }}>Algo deu errado</h1>
        <p style={{ margin: 0 }}>
          Não foi possível carregar o Painel CRM. Tente novamente.
        </p>
        <div>
          <button onClick={() => retry()}>Tentar novamente</button>
        </div>
      </body>
    </html>
  );
}
