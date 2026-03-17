"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const resp = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();
      
      if (!resp.ok) throw new Error(data.error || "Failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-8 font-sans">
      <h1 className="text-3xl font-bold mb-2">Price Testing API</h1>
      <p className="text-gray-400 mb-8">Test the standalone Gemini-driven "simpler approach" for price extraction.</p>

      <form onSubmit={handleTest} className="flex gap-4 mb-8">
        <input 
          type="url" 
          required
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Paste Myntra or other product URL here..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-colors"
        >
          {loading ? "Analyzing..." : "Test Link"}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-8">
          {error}
        </div>
      )}

      {result && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-white/10 pb-2">1. Gemini Extraction</h2>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="mb-4">
                <span className="text-gray-400 text-sm">Product Name</span>
                <p className="font-medium">{result.ai?.product?.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <span className="text-gray-400 text-sm">Brand</span>
                  <p className="font-medium">{result.ai?.product?.brand}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Extracted Price</span>
                  <p className="font-bold text-green-400 text-xl">₹{result.ai?.product?.price}</p>
                </div>
              </div>
              
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">AI Platform Estimates</h3>
              <div className="space-y-3">
                {result.ai?.platforms?.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-black/20 rounded-lg">
                    <span className="font-medium">{p.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">₹{p.price}</span>
                      <a href={p.url} target="_blank" className="text-blue-400 hover:text-blue-300 text-sm">Link ↗</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-white/10 pb-2">2. Google Shopping (Serper)</h2>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 overflow-y-auto max-h-[600px]">
              {result.googleShopping?.length === 0 ? (
                <p className="text-gray-400">No Shopping results found.</p>
              ) : (
                <div className="space-y-3">
                  {result.googleShopping?.map((item: any, i: number) => (
                    <div key={i} className="p-3 bg-black/20 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-blue-400">{item.source}</span>
                        <span className="font-bold text-green-400">{item.price}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2 line-clamp-2">{item.title}</p>
                      <a href={item.link} target="_blank" className="text-xs text-blue-400 hover:underline break-all">
                        {item.link.split('?')[0]}...
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
