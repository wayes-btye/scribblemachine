export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-4">Coloring Page Generator</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Transform your photos into beautiful coloring pages
        </p>
        <div className="flex gap-4 justify-center">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
            Upload Photo
          </button>
          <button className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
            Browse Gallery
          </button>
        </div>
      </div>
    </main>
  );
}