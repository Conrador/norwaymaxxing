/**
 * Citations for the health and lifestyle guidance shown in the app.
 *
 * App Store guideline 1.4.1 requires medical/health information to cite its
 * sources with links the user can easily find. Every protocol and diet screen
 * links to the in-app Sources screen, which renders these groups.
 *
 * These references back general, non-personalized wellbeing guidance — not a
 * medical prescription. Keep the list to reputable public-health bodies and
 * peer-reviewed reviews, and verify each URL before every submission.
 */

export type SourceEntry = {
  /** Human-readable citation shown to the user. */
  title: string;
  /** Publisher / issuing body. */
  publisher: string;
  /** Canonical link to the source. */
  url: string;
};

export type SourceGroup = {
  /** Which protocol module this group backs (matches ProtocolModule ids). */
  module: 'diet' | 'sauna' | 'cold' | 'breath' | 'nature';
  /** i18n key for the group heading. */
  titleKey: string;
  entries: SourceEntry[];
};

export const SOURCE_GROUPS: SourceGroup[] = [
  {
    module: 'diet',
    titleKey: 'sources.groups.diet',
    entries: [
      {
        title: 'Nordic Nutrition Recommendations 2023',
        publisher: 'Nordic Council of Ministers',
        url: 'https://www.norden.org/en/publication/nordic-nutrition-recommendations-2023',
      },
      {
        title: 'Healthy diet — fact sheet',
        publisher: 'World Health Organization',
        url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
      },
      {
        title: 'The Eatwell Guide',
        publisher: 'NHS (UK)',
        url: 'https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/',
      },
      {
        title: 'EAACI guidelines on the management of IgE-mediated food allergy (2024)',
        publisher: 'European Academy of Allergy and Clinical Immunology / PubMed',
        url: 'https://pubmed.ncbi.nlm.nih.gov/39473345/',
      },
    ],
  },
  {
    module: 'sauna',
    titleKey: 'sources.groups.sauna',
    entries: [
      {
        title:
          'Cardiovascular and Other Health Benefits of Sauna Bathing: A Review of the Evidence (Laukkanen et al., Mayo Clin Proc, 2018)',
        publisher: 'PubMed / Mayo Clinic Proceedings',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30077204/',
      },
      {
        title: 'Clinical Effects of Regular Dry Sauna Bathing: A Systematic Review (2018)',
        publisher: 'PubMed Central',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5941775/',
      },
      {
        title: 'Health effects and risks of sauna bathing (2006)',
        publisher: 'PubMed',
        url: 'https://pubmed.ncbi.nlm.nih.gov/16871826/',
      },
    ],
  },
  {
    module: 'cold',
    titleKey: 'sources.groups.cold',
    entries: [
      {
        title:
          'Health effects of voluntary exposure to cold water — a continuing subject of debate (Esperland et al., Int J Circumpolar Health, 2022)',
        publisher: 'PubMed / International Journal of Circumpolar Health',
        url: 'https://pubmed.ncbi.nlm.nih.gov/36137565/',
      },
      {
        title: 'The Effect of Cold Showering on Health and Work: A Randomized Controlled Trial (2016)',
        publisher: 'PubMed Central',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5025014/',
      },
      {
        title: 'Autonomic conflict: a different way to die during cold water immersion? (2012)',
        publisher: 'PubMed Central / The Journal of Physiology',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3459038/',
      },
    ],
  },
  {
    module: 'breath',
    titleKey: 'sources.groups.breath',
    entries: [
      {
        title:
          'How Breath-Control Can Change Your Life: A Systematic Review on Psycho-Physiological Correlates of Slow Breathing (Zaccaro et al., Front Hum Neurosci, 2018)',
        publisher: 'PubMed / Frontiers in Human Neuroscience',
        url: 'https://pubmed.ncbi.nlm.nih.gov/30245619/',
      },
      {
        title: 'The physiological effects of slow breathing in the healthy human (2017)',
        publisher: 'PubMed / European Respiratory Society',
        url: 'https://pubmed.ncbi.nlm.nih.gov/29209423/',
      },
    ],
  },
  {
    module: 'nature',
    titleKey: 'sources.groups.nature',
    entries: [
      {
        title: 'Physical activity — fact sheet',
        publisher: 'World Health Organization',
        url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
      },
      {
        title: 'Nature-based outdoor activities for mental and physical health: systematic review and meta-analysis (2021)',
        publisher: 'PubMed / SSM - Population Health',
        url: 'https://pubmed.ncbi.nlm.nih.gov/34646931/',
      },
      {
        title: 'The right to roam (Allemannsretten)',
        publisher: 'Norwegian Environment Agency',
        url: 'https://www.miljodirektoratet.no/ansvarsomrader/friluftsliv/friluftsliv-og-allemannsretten/allemannsretten/',
      },
    ],
  },
];

/** All source groups relevant to a module, in display order. */
export function sourceGroupsForModule(
  module: SourceGroup['module'],
): SourceGroup[] {
  return SOURCE_GROUPS.filter((group) => group.module === module);
}
