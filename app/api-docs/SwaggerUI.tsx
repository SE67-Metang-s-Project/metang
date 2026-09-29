"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";

import "@scalar/api-reference-react/style.css";
import { withBasePath } from "@/lib/base-path";

export default function SwaggerUIPage() {
  return (
    <ApiReferenceReact
      configuration={{
        url: withBasePath("/openapi.json"),
        persistAuth: false,
        hideModels: true,
        customFetch: (input, init) =>
          fetch(input, { ...init, credentials: "include" }),
      }}
    />
  );
}
