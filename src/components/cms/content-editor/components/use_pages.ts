import { Page } from "@/types/cms";
import { useState, useEffect } from "react";

// Mock data
const MOCK_PAGES: Page[] = [
  {
    id: "p1",
    website_id: "w1",
    name: "Home",
    slug: "",
    status: "active",
    sections: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p2",
    website_id: "w1",
    name: "About Us",
    slug: "about",
    status: "active",
    sections: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p3",
    website_id: "w1",
    name: "Services",
    slug: "services",
    status: "active",
    sections: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p4",
    website_id: "w1",
    name: "Contact",
    slug: "contact",
    status: "active",
    sections: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p5",
    website_id: "w1",
    name: "Blog",
    slug: "blog",
    status: "active",
    sections: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p6",
    website_id: "w1",
    name: "Privacy Policy",
    slug: "privacy",
    status: "draft",
    sections: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      setIsLoading(true);
      try {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setPages(MOCK_PAGES);
      } catch (err) {
        setError("Failed to load pages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, []);

  return { pages, isLoading, error };
}



