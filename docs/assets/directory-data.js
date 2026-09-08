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
  ]
};

window.MMC_DIRECTORY_RECORDS = [
  {
    organizationName: 'Organization Name 01', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Ambassador', sectors: ['Business & Industry'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: true
  },
  {
    organizationName: 'Organization Name 02', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Member', sectors: ['Community Recreation, Fitness & Parks', 'Sport'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: false
  },
  {
    organizationName: 'Organization Name 03', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Ambassador', sectors: ['Education'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: true
  },
  {
    organizationName: 'Organization Name 04', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Ambassador', sectors: ['Faith-Based', 'Public Health'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: false
  },
  {
    organizationName: 'Organization Name 05', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Member', sectors: ['Healthcare'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: true
  },
  {
    organizationName: 'Organization Name 06', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Member', sectors: ['Media & Communications'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: false
  },
  {
    organizationName: 'Organization Name 07', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Member', sectors: ['Military & First Responder'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: false
  },
  {
    organizationName: 'Organization Name 08', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Ambassador', sectors: ['Transportation, Land Use & Community Design'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: true, ceoPledgeSigner: true
  },
  {
    organizationName: 'Organization Name 09', organizationLogo: 'Logo', representativeName: 'First Last', representativeTitle: 'Job Title',
    primaryRole: 'Coalition Member', sectors: ['Sport'],
    website: 'https://example.org/', shortDescription: 'Brief organization description goes here.', directoryConsent: false, ceoPledgeSigner: true
  }
];
