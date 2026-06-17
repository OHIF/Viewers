export type ToothNumberingSystem = 'FDI' | 'Universal';

export type ToothIdentity = {
  id: string;
  fdi: string;
  universal: string;
  label: string;
};

const permanentToothMap: Array<[string, string, string]> = [
  ['18', '1', 'Maxillary right third molar'],
  ['17', '2', 'Maxillary right second molar'],
  ['16', '3', 'Maxillary right first molar'],
  ['15', '4', 'Maxillary right second premolar'],
  ['14', '5', 'Maxillary right first premolar'],
  ['13', '6', 'Maxillary right canine'],
  ['12', '7', 'Maxillary right lateral incisor'],
  ['11', '8', 'Maxillary right central incisor'],
  ['21', '9', 'Maxillary left central incisor'],
  ['22', '10', 'Maxillary left lateral incisor'],
  ['23', '11', 'Maxillary left canine'],
  ['24', '12', 'Maxillary left first premolar'],
  ['25', '13', 'Maxillary left second premolar'],
  ['26', '14', 'Maxillary left first molar'],
  ['27', '15', 'Maxillary left second molar'],
  ['28', '16', 'Maxillary left third molar'],
  ['38', '17', 'Mandibular left third molar'],
  ['37', '18', 'Mandibular left second molar'],
  ['36', '19', 'Mandibular left first molar'],
  ['35', '20', 'Mandibular left second premolar'],
  ['34', '21', 'Mandibular left first premolar'],
  ['33', '22', 'Mandibular left canine'],
  ['32', '23', 'Mandibular left lateral incisor'],
  ['31', '24', 'Mandibular left central incisor'],
  ['41', '25', 'Mandibular right central incisor'],
  ['42', '26', 'Mandibular right lateral incisor'],
  ['43', '27', 'Mandibular right canine'],
  ['44', '28', 'Mandibular right first premolar'],
  ['45', '29', 'Mandibular right second premolar'],
  ['46', '30', 'Mandibular right first molar'],
  ['47', '31', 'Mandibular right second molar'],
  ['48', '32', 'Mandibular right third molar'],
];

export const TOOTH_IDENTITIES: ToothIdentity[] = permanentToothMap.map(
  ([fdi, universal, label]) => ({
    id: `permanent-${universal}`,
    fdi,
    universal,
    label,
  })
);

const toothById = new Map(TOOTH_IDENTITIES.map(tooth => [tooth.id, tooth]));
const toothByFDI = new Map(TOOTH_IDENTITIES.map(tooth => [tooth.fdi, tooth]));
const toothByUniversal = new Map(TOOTH_IDENTITIES.map(tooth => [tooth.universal, tooth]));

export const DEFAULT_TOOTH_ID = 'permanent-30';

export function getToothIdentityById(toothId: string): ToothIdentity | undefined {
  return toothById.get(toothId);
}

export function getToothIdentityByFDI(fdi: string | number): ToothIdentity | undefined {
  return toothByFDI.get(String(fdi));
}

export function getToothIdentityByUniversal(universal: string | number): ToothIdentity | undefined {
  return toothByUniversal.get(String(universal));
}

export function getToothDisplayValue(
  tooth: ToothIdentity,
  numberingSystem: ToothNumberingSystem
): string {
  return numberingSystem === 'FDI' ? tooth.fdi : tooth.universal;
}

export function getToothDisplayLabel(
  tooth: ToothIdentity,
  numberingSystem: ToothNumberingSystem
): string {
  return `${numberingSystem} ${getToothDisplayValue(tooth, numberingSystem)}`;
}
