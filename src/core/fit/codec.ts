import { Decoder, Encoder, Profile, Stream, type Mesg } from '@garmin/fitsdk';
import type {
  FitDeveloperFieldRegistration,
  FitDocument,
  FitEntry,
  FitMesgObject,
} from './types';

export const SEMICIRCLES_TO_DEGREES = 180 / Math.pow(2, 31);
export const DEGREES_TO_SEMICIRCLES = Math.pow(2, 31) / 180;

export function getMesgName(mesgNum: number): string {
  const profileMesg = (Profile.messages as Record<number, { name?: string }>)[mesgNum];
  return profileMesg?.name ?? `unknown_${mesgNum}`;
}

export function cloneMesg(mesg: FitMesgObject): FitMesgObject {
  const result: FitMesgObject = {};
  for (const [key, value] of Object.entries(mesg)) {
    if (value instanceof Date) {
      result[key] = new Date(value.getTime());
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item instanceof Date
          ? new Date(item.getTime())
          : item && typeof item === 'object'
            ? cloneMesg(item as FitMesgObject)
            : item,
      );
    } else if (value && typeof value === 'object') {
      result[key] = cloneMesg(value as FitMesgObject);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function cloneEntries(entries: FitEntry[]): FitEntry[] {
  return entries.map((entry) => ({
    mesgNum: entry.mesgNum,
    mesgName: entry.mesgName,
    mesg: cloneMesg(entry.mesg),
  }));
}

export function decodeFit(bytes: Uint8Array, fileName = 'activity.fit'): FitDocument {
  const stream = Stream.fromByteArray(bytes);
  if (!Decoder.isFIT(stream)) {
    throw new Error('File is not a valid .FIT binary file (missing .FIT header).');
  }

  const decoder = new Decoder(stream);
  const warnings: string[] = [];

  if (!decoder.checkIntegrity()) {
    warnings.push('FIT CRC integrity check failed — attempting best-effort decode.');
  }

  const entries: FitEntry[] = [];
  const developerFields: FitDeveloperFieldRegistration[] = [];
  const devDataIdsByIndex = new Map<number, FitMesgObject>();

  const { errors } = decoder.read({
    applyScaleAndOffset: true,
    expandSubFields: false,
    expandComponents: true,
    convertTypesToStrings: true,
    convertDateTimesToDates: true,
    includeUnknownData: false,
    mergeHeartRates: false,
    mesgListener: (mesgNum: number, mesg: Mesg) => {
      const cloned = cloneMesg(mesg as FitMesgObject);
      entries.push({
        mesgNum,
        mesgName: getMesgName(mesgNum),
        mesg: cloned,
      });

      if (mesgNum === Profile.MesgNum.DEVELOPER_DATA_ID) {
        const idx = cloned.developerDataIndex;
        if (typeof idx === 'number') {
          devDataIdsByIndex.set(idx, cloned);
        }
      }
    },
    fieldDescriptionListener: (
      key: number,
      developerDataIdMesg: Mesg,
      fieldDescriptionMesg: Mesg,
    ) => {
      if (developerDataIdMesg && fieldDescriptionMesg) {
        developerFields.push({
          key,
          developerDataIdMesg: cloneMesg(developerDataIdMesg as FitMesgObject),
          fieldDescriptionMesg: cloneMesg(fieldDescriptionMesg as FitMesgObject),
        });
      }
    },
  });

  if (errors && errors.length > 0) {
    for (const err of errors) {
      warnings.push(err instanceof Error ? err.message : String(err));
    }
  }

  return {
    fileName,
    fileSize: bytes.byteLength,
    entries,
    developerFields,
    warnings,
  };
}

export function encodeFit(doc: Pick<FitDocument, 'entries' | 'developerFields'>): {
  bytes: Uint8Array;
  warnings: string[];
} {
  const encoder = new Encoder();
  const warnings: string[] = [];

  for (const devField of doc.developerFields) {
    try {
      encoder.addDeveloperField(
        devField.key,
        devField.developerDataIdMesg as Parameters<Encoder['addDeveloperField']>[1],
        devField.fieldDescriptionMesg as Parameters<Encoder['addDeveloperField']>[2],
      );
    } catch (err) {
      warnings.push(
        `Skipped developer field "${devField.key}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const profileMessages = Profile.messages as Record<
    number,
    { fields?: Record<number, { name: string }> }
  >;

  let skippedUnknownMesgs = 0;
  let skippedEmptyMesgs = 0;

  for (const entry of doc.entries) {
    const mesgProfile = profileMessages[entry.mesgNum];
    if (!mesgProfile) {
      skippedUnknownMesgs += 1;
      continue;
    }

    // Ensure at least one valid profile field exists before passing to Encoder
    const knownFieldNames = new Set(
      Object.values(mesgProfile.fields ?? {}).map((f) => f.name),
    );
    const hasKnownField = Object.entries(entry.mesg).some(
      ([k, v]) => v != null && knownFieldNames.has(k),
    );
    if (!hasKnownField) {
      skippedEmptyMesgs += 1;
      continue;
    }

    try {
      encoder.onMesg(entry.mesgNum, entry.mesg);
    } catch (err) {
      warnings.push(
        `Skipped ${entry.mesgName} (#${entry.mesgNum}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (skippedUnknownMesgs > 0) {
    warnings.push(`Skipped ${skippedUnknownMesgs} vendor/unknown message(s) not in FIT Profile.`);
  }
  if (skippedEmptyMesgs > 0) {
    warnings.push(`Skipped ${skippedEmptyMesgs} empty message(s) with no remaining valid fields.`);
  }

  const bytes = encoder.close();
  return { bytes, warnings };
}
