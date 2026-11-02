// Illustrative fixtures, not assessments of uploaded images or real properties.
// IDs are stable because the service and tests use them as explicit sample keys.
export const sampleDamageCases = [
  {
    id: 'cape-coral-roof',
    title: 'Cape Coral roof',
    description: 'Illustrative displaced roof covering and exposed underlayment.',
    imageUrl: '/samples/cape-coral-roof.svg',
    summary: 'Sample: the illustration suggests roof covering displacement and exposed underlayment. The extent and concealed condition are unverified.',
    severity: 'moderate',
    observations: [
      'Illustrative roof covering panels appear displaced.',
      'An area of underlayment is shown exposed.',
      'No interior or attic condition is visible in this sample.',
    ],
    hazards: [
      'Concealed decking damage or water intrusion cannot be assessed from this illustration.',
      'Loose roof material could become a falling hazard in wind.',
    ],
    nextSteps: [
      'Document visible damage from a safe location and record the date.',
      'Keep receipts and correspondence for the property owner or insurer.',
      'Arrange an inspection by a qualified roofing professional before repair decisions.',
    ],
    limitations: [
      'This is a synthetic illustration, not a photograph of a real property.',
      'A single view cannot establish structural safety or the full extent of damage.',
    ],
  },
  {
    id: 'fort-myers-flood',
    title: 'Fort Myers flood',
    description: 'Illustrative interior waterline and silt residue.',
    imageUrl: '/samples/fort-myers-flood.svg',
    summary: 'Sample: the illustration suggests interior water exposure at a visible waterline. The cause, duration, and concealed damage are unverified.',
    severity: 'major',
    observations: [
      'An illustrative waterline is shown across an interior wall.',
      'Silt-like residue is suggested near the lower wall.',
      'No electrical, structural, or attic condition is visible in this sample.',
    ],
    hazards: [
      'A photo cannot establish whether electrical systems or structural components are safe.',
      'Moisture may support mold growth in concealed spaces, but mold is not confirmed by this sample.',
      'Contaminated floodwater can present health risks; avoid unprotected contact.',
    ],
    nextSteps: [
      'Avoid entering areas with standing water, visible electrical damage, or unstable ceilings.',
      'Photograph the waterline and affected contents from a safe location.',
      'Contact a qualified inspector and the property owner or insurer before cleanup or repairs.',
      'Keep a dated record of discarded or damaged items.',
    ],
    limitations: [
      'This is a synthetic illustration, not a photograph of a real property.',
      'The visible waterline does not establish the water source, category, or full scope of damage.',
    ],
  },
  {
    id: 'sanibel-lanai',
    title: 'Sanibel lanai',
    description: 'Illustrative screen-enclosure separation and frame deformation.',
    imageUrl: '/samples/sanibel-lanai.svg',
    summary: 'Sample: the illustration suggests screen-enclosure separation and frame deformation. Stability and the full extent of damage are unverified.',
    severity: 'minor',
    observations: [
      'An illustrative screen panel appears separated from its frame.',
      'The frame is shown with a visible deformation.',
      'No foundation or structural connection is visible in this sample.',
    ],
    hazards: [
      'Sharp edges and loose panels may be present.',
      'The enclosure may not be stable in wind; keep people away until it is assessed.',
    ],
    nextSteps: [
      'Document the visible separation from a safe distance.',
      'Keep people and pets away from loose panels or sharp edges.',
      'Arrange an inspection by a qualified enclosure or screen contractor.',
    ],
    limitations: [
      'This is a synthetic illustration, not a photograph of a real property.',
      'A single view cannot establish whether the enclosure remains structurally stable.',
    ],
  },
];
