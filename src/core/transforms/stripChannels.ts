import { Profile } from '@garmin/fitsdk';
import { cloneEntries } from '../fit/codec';
import { CHANNEL_FIELD_MAP } from '../fit/summary';
import type { ChannelKey, FitEntry } from '../fit/types';

/**
 * Strips one or more telemetry channels from record, lap, and session messages.
 * Also removes standalone HRV messages when 'hrv' is selected, and standalone HR
 * messages when 'heartRate' is selected.
 */
export function stripChannels(
  entries: FitEntry[],
  channels: ChannelKey[],
): FitEntry[] {
  if (channels.length === 0) return cloneEntries(entries);

  const channelSet = new Set(channels);
  const recordFieldsToStrip = new Set<string>();
  const summaryFieldsToStrip = new Set<string>();

  for (const ch of channels) {
    const def = CHANNEL_FIELD_MAP[ch];
    if (!def) continue;
    for (const f of def.record) recordFieldsToStrip.add(f);
    for (const f of def.summary) summaryFieldsToStrip.add(f);
  }

  const next = cloneEntries(entries).filter((entry) => {
    if (channelSet.has('hrv') && entry.mesgNum === Profile.MesgNum.HRV) {
      return false;
    }
    if (channelSet.has('heartRate') && entry.mesgNum === Profile.MesgNum.HR) {
      return false;
    }
    return true;
  });

  for (const entry of next) {
    if (entry.mesgNum === Profile.MesgNum.RECORD) {
      for (const field of recordFieldsToStrip) {
        delete entry.mesg[field];
      }
    } else if (
      entry.mesgNum === Profile.MesgNum.LAP ||
      entry.mesgNum === Profile.MesgNum.SESSION
    ) {
      for (const field of summaryFieldsToStrip) {
        delete entry.mesg[field];
      }
    }
  }

  return next;
}
