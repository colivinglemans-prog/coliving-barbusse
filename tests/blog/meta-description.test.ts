import { describe, expect, it } from "vitest";
import { BLOG_POSTS, metaDescriptionOf, type LocalizedPost } from "@/lib/blog/posts";

const base: LocalizedPost = {
  title: "Titre",
  description: "Le chapeau affiché sous le titre de l'article.",
  excerpt: "Extrait",
  keywords: [],
};

describe("metaDescriptionOf", () => {
  it("prend metaDescription quand elle existe", () => {
    expect(metaDescriptionOf({ ...base, metaDescription: "La meta, plus courte." })).toBe(
      "La meta, plus courte.",
    );
  });

  it("se replie sur la description quand metaDescription est absente", () => {
    expect(metaDescriptionOf(base)).toBe(base.description);
  });

  it("ne touche jamais au chapeau", () => {
    const loc = { ...base, metaDescription: "La meta, plus courte." };
    metaDescriptionOf(loc);
    expect(loc.description).toBe(base.description);
  });

  it("chaque metaDescription renseignée tient dans 120-155 caractères (Bing)", () => {
    const horsBornes = BLOG_POSTS.flatMap((post) =>
      Object.entries(post.locales)
        .filter(([, loc]) => loc.metaDescription !== undefined)
        .map(([locale, loc]) => ({
          cle: `${post.slug}/${locale}`,
          longueur: [...(loc.metaDescription as string)].length,
        }))
        .filter(({ longueur }) => longueur < 120 || longueur > 155),
    );
    expect(horsBornes).toEqual([]);
  });
});
