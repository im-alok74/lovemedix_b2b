/**
 * Category grouping.
 *
 * `medicines.category` is free text typed by whoever uploaded the stock, and it shows:
 * 92 stocked products carry 33 distinct category strings. "Nutritional Supplement",
 * "Multivitamin & Nutritional Supplement", "Nutraceutical — Multivitamin, Multimineral &
 * Amino Acid Supplement" and "Vitamin Supplement / Antioxidant Supplement" are all the
 * same shelf. Rendering that raw is what makes the current footer look like a data dump.
 *
 * So the raw string is never shown to a customer. It is matched against the patterns
 * below and collapsed into one of these groups, which are the only category labels the
 * storefront uses.
 *
 * This lives in TypeScript rather than a generated column because at this inventory size
 * (under a hundred stocked SKUs) the whole catalogue is one cheap query, and grouping it
 * in memory costs nothing while avoiding a schema migration the operator has to run.
 * If stocked inventory ever passes a few thousand SKUs, move `patterns` into a
 * `category_group` generated column and group in SQL instead.
 */

export interface CategoryGroup {
  /** URL-safe key. Used as ?group= on /medicines. */
  key: string
  /** What the customer reads. Plain words, no clinical jargon. */
  label: string
  /**
   * Lower-cased substrings matched against `medicines.category`. First group with any
   * match wins, so order matters: put the specific before the general.
   */
  patterns: string[]
}

/**
 * Ordered most-specific first.
 *
 * "pain relief / topical anti-inflammatory" must reach `pain-relief` before a looser
 * pattern claims it, and "antibiotic / antiprotozoal" must not be caught by a generic
 * "anti" match.
 */
export const CATEGORY_GROUPS: readonly CategoryGroup[] = [
  {
    key: "cold-cough",
    label: "Cold & Cough",
    patterns: ["cough", "cold &", "cold /", "nasal", "decongestant", "allergy", "respiratory", "fever"],
  },
  {
    key: "pain-relief",
    label: "Pain Relief",
    patterns: ["pain relief", "anti-inflammatory", "analgesic", "muscle relaxant", "antispasmodic", "neuropathic"],
  },
  {
    key: "bone-joint",
    label: "Bone & Joint",
    patterns: ["bone", "joint", "osteoarthritis", "calcium", "vitamin d"],
  },
  {
    key: "digestion",
    label: "Acidity & Digestion",
    patterns: ["acidity", "gerd", "antacid", "heartburn", "gastro", "digestive", "indigestion", "gas relief", "colic", "antiemetic", "nausea"],
  },
  {
    key: "liver-care",
    label: "Liver Care",
    patterns: ["liver", "gallstone", "bile"],
  },
  {
    key: "kidney-urology",
    label: "Kidney & Urology",
    patterns: ["urology", "kidney", "urinary", "prostat"],
  },
  {
    key: "womens-health",
    label: "Women's Health",
    patterns: ["women", "pcos", "menstrual", "gynaec"],
  },
  {
    key: "baby-care",
    label: "Baby Care",
    patterns: ["infant", "baby", "paediatric", "pediatric"],
  },
  {
    key: "skin-hair",
    label: "Skin & Hair",
    patterns: ["skin", "derma", "hair", "personal care", "cosmet"],
  },
  {
    key: "ayurveda",
    label: "Ayurveda & Herbal",
    patterns: ["ayurved", "herbal", "homeo", "unani", "churna"],
  },
  {
    key: "diabetes",
    label: "Diabetes Care",
    patterns: ["diabet", "insulin", "glucose"],
  },
  {
    key: "heart-care",
    label: "Heart & BP",
    patterns: ["cardiac", "cardio", "heart", "hypertens", "blood pressure"],
  },
  {
    key: "blood-iron",
    label: "Blood & Iron",
    patterns: ["iron", "haematinic", "hematinic", "anaemia", "anemia"],
  },
  {
    key: "vitamins",
    label: "Vitamins & Nutrition",
    patterns: ["vitamin", "multivitam", "nutraceutic", "nutrition", "supplement", "mineral", "protein", "amino acid", "antioxidant"],
  },
  {
    key: "antibiotics",
    label: "Antibiotics",
    patterns: ["antibiotic", "anti-infective", "antibacter", "antiprotozoal", "anti-tb"],
  },
  {
    key: "surgical",
    label: "Surgical & First Aid",
    patterns: ["surgical", "first aid", "bandage", "syringe", "glove", "dressing", "device"],
  },
] as const

const GROUP_BY_KEY = new Map(CATEGORY_GROUPS.map((group) => [group.key, group]))

/**
 * Collapses one free-text category string into a group key, or null when nothing matches.
 *
 * Null is a real answer, not a failure: an unmatched product simply does not appear under
 * any category tile. That is better than inventing a "Other" bucket nobody browses.
 */
export function categoryGroupKey(rawCategory: string | null | undefined): string | null {
  if (!rawCategory) return null
  const haystack = rawCategory.toLowerCase()

  for (const group of CATEGORY_GROUPS) {
    if (group.patterns.some((pattern) => haystack.includes(pattern))) {
      return group.key
    }
  }
  return null
}

/** Display label for a group key. Falls back to the key so a bad URL never renders blank. */
export function categoryLabel(key: string): string {
  return GROUP_BY_KEY.get(key)?.label ?? key
}

export function isCategoryGroup(key: string | null | undefined): boolean {
  return Boolean(key && GROUP_BY_KEY.has(key))
}
