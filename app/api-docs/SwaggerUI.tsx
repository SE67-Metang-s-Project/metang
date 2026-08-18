"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";

import "@scalar/api-reference-react/style.css";

export default function SwaggerUIPage() {
  return (
    <ApiReferenceReact
      configuration={{
        url: "/openapi.json",
        persistAuth: false,
        hideModels: true,
        customFetch: (input, init) =>
          fetch(input, { ...init, credentials: "include" }),
      }}
    />
  );
}
