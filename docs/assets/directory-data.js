/*
 * DEMONSTRATION DATA ONLY.
 * Replace these explicit placeholders with approved, consented records.
 * The record with directoryConsent:false exists to verify the privacy gate.
 */
window.MMC_DIRECTORY_CONFIG = {
  representativeLabel: 'Representative',
  sectors: [
    'Business & Industry',
    'Community Recreation, Fitness & Parks',
    'Education',
    'Faith-Based',
    'Healthcare',
    'Media & Communications',
    'Military & First Responder',
    'Public Health',
    'Sport',
    'Transportation, Land Use & Community Design'
  ],
  regions: ['Region Name 01', 'Region Name 02', 'Region Name 03', 'Region Name 04'],
  counties: [
    'County Name 01',
    'County Name 02',
    'County Name 03',
    'County Name 04',
    'County Name 05',
    'County Name 06',
    'County Name 07',
    'County Name 08',
    'County Name 09',
    'County Name 10'
  ]
};

window.MMC_DIRECTORY_RECORDS = [
  {
    organizationName: 'Organization Name 01', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Ambassador', sectors: ['Business & Industry'], region: 'Region Name 01', countiesServed: ['County Name 01'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: true
  },
  {
    organizationName: 'Organization Name 02', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Member', sectors: ['Community Recreation, Fitness & Parks', 'Sport'], region: 'Region Name 02', countiesServed: ['County Name 02', 'County Name 03'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: false
  },
  {
    organizationName: 'Organization Name 03', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Partner', sectors: ['Education'], region: 'Region Name 03', countiesServed: ['County Name 04'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: true
  },
  {
    organizationName: 'Organization Name 04', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Ambassador', sectors: ['Faith-Based', 'Public Health'], region: 'Region Name 04', countiesServed: ['County Name 05'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: false
  },
  {
    organizationName: 'Organization Name 05', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Member', sectors: ['Healthcare'], region: 'Region Name 01', countiesServed: ['County Name 06'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: true
  },
  {
    organizationName: 'Organization Name 06', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Partner', sectors: ['Media & Communications'], region: 'Region Name 02', countiesServed: ['County Name 07'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: false
  },
  {
    organizationName: 'Organization Name 07', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Member', sectors: ['Military & First Responder'], region: 'Region Name 03', countiesServed: ['County Name 08'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: false
  },
  {
    organizationName: 'Organization Name 08', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Ambassador', sectors: ['Transportation, Land Use & Community Design'], region: 'Region Name 04', countiesServed: ['County Name 09'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: true
  },
  {
    organizationName: 'Organization Name 09', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Partner', sectors: ['Sport'], region: 'Region Name 02', countiesServed: ['County Name 10'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: false, ceoPledgeSigner: true
  }
];
