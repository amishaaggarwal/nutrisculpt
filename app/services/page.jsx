import { redirect } from "next/navigation";

// The standalone /services overview has been removed. The homepage Our
// Services section (/#services) is the canonical services overview.
// Permanent redirect preserves compatibility with old bookmarks and links.
export default function ServicesPage() {
  redirect("/#services");
}
