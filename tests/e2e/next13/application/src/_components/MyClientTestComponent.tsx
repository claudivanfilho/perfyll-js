"use client";

import { useEffect, useState } from "react";
import { init, logError, mark } from "../../../../../../dist";

init({
  publicKey: process.env.NEXT_PUBLIC_PERFYLL_PUBLIC_KEY!,
  customHttpUrl: process.env.NEXT_PUBLIC_PERFYLL_CUSTOM_API_URL,
});

function fetcher(path: string) {
  return fetch(path).then((res) => {
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  });
}

export default function MyClientTestComponent() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    mark("testNext14Front").send();
    setMsg("App Loaded Successfully");
  }, []);

  return (
    <div className="p-4 flex justify-center flex-col items-center">
      {msg && (
        <div data-testid="status-msg" className="w-full text-center">
          {msg}
        </div>
      )}
      <button
        data-testid="test-api-button"
        className="bg-blue-500 p-3 mx-2 w-36 mt-4 text-white"
        onClick={() => fetcher("/api/test")}
      >
        Test Api Route
      </button>
      <button
        data-testid="test-error"
        className="bg-blue-500 p-3 mx-2 w-36 mt-4 text-white"
        onClick={() => {
          fetcher("/api/test2").catch((err) => {
            logError(err, { framework: "next13", mode: "frontend" });
            setMsg("LogError working fine");
          });
        }}
      >
        Test Log Error
      </button>
      <button
        data-testid="test-error-api"
        className="bg-blue-500 p-3 mx-2 w-36 mt-4 text-white"
        onClick={() => {
          fetcher("/api/test-error").catch(() => {
            setMsg("LogError of Api working fine");
          });
        }}
      >
        Test Log Error API
      </button>
    </div>
  );
}
