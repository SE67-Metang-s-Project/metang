import type { Metadata } from "next";

import SwaggerUIPage from "./SwaggerUI";

export const metadata: Metadata = {
  title: "API Docs | Me Tang",
  description: "Interactive OpenAPI documentation for the Me Tang API",
};

export default function ApiDocsPage() {
  return <SwaggerUIPage />;
}
