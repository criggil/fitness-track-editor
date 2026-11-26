import { describe, expect, it } from 'vitest';
import { Decoder, Profile, Stream } from '@garmin/fitsdk';
import { decodeFit, encodeFit } from './codec';
import { createDemoFitBytes } from './demoTrack';
import { buildTrackProjection } from './projection';
import { computeTrackSummary } from './summary';
import { stripChannels } from '../transforms/stripChannels';
import { applyAverageSpeed } from '../transforms/editSpeed';
import { editTotalDistance, stripDistance } from '../transforms/editDistance';
import { editActivityType } from '../transforms/editActivityType';

describe('FIT codec & transforms round-trip', () => {
  const demoBytes = createDemoFitBytes({ pointCount: 120 });

  it('decodes and re-encodes a .FIT file cleanly with valid CRC', () => {
    const doc = decodeFit(demoBytes, 'demo.fit');
    expect(doc.warnings).toEqual([]);
    const summary = computeTrackSummary(doc.entries);
    expect(summary.recordCount).toBe(120);
    expect(summary.lapCount).toBe(2);
    expect(summary.sessionCount).toBe(1);
    expect(summary.sport).toBe('cycling');
    expect(summary.channels.gps.present).toBe(true);
    expect(summary.channels.elevation.present).toBe(true);
    expect(summary.channels.speed.present).toBe(true);
    expect(summary.channels.heartRate.present).toBe(true);
    expect(summary.channels.power.present).toBe(true);

    const { bytes: reEncoded, warnings } = encodeFit(doc);
    expect(warnings).toEqual([]);

    const checkStream = Stream.fromByteArray(reEncoded);
    expect(Decoder.isFIT(checkStream)).toBe(true);
    expect(new Decoder(checkStream).checkIntegrity()).toBe(true);

    const doc2 = decodeFit(reEncoded, 'demo-reencoded.fit');
    const summary2 = computeTrackSummary(doc2.entries);
    expect(summary2.recordCount).toBe(summary.recordCount);
    expect(summary2.totalDistance).toBeCloseTo(summary.totalDistance!, 1);
    expect(summary2.totalTimerTime).toBeCloseTo(summary.totalTimerTime!, 1);
    expect(summary2.avgHeartRate).toBe(summary.avgHeartRate);
  });

  it('strips GPS, Elevation, and Speed completely across record/lap/session and round-trips cleanly', () => {
    const doc = decodeFit(demoBytes, 'demo.fit');
    const strippedEntries = stripChannels(doc.entries, ['gps', 'elevation', 'speed']);

    const { bytes, warnings } = encodeFit({
      entries: strippedEntries,
      developerFields: doc.developerFields,
    });
    expect(warnings).toEqual([]);

    const decoded = decodeFit(bytes, 'stripped.fit');
    const summary = computeTrackSummary(decoded.entries);
    const proj = buildTrackProjection(decoded.entries);

    expect(summary.channels.gps.present).toBe(false);
    expect(summary.channels.elevation.present).toBe(false);
    expect(summary.channels.speed.present).toBe(false);
    // Untouched channels survive
    expect(summary.channels.heartRate.present).toBe(true);
    expect(summary.channels.power.present).toBe(true);
    expect(proj.coordinates.length).toBe(0);
    expect(proj.bounds).toBeNull();
  });

  it('applies uniform average speed from totalDistance / totalTimerTime and optionally syncs distance curve', () => {
    const doc = decodeFit(demoBytes, 'demo.fit');
    const before = computeTrackSummary(doc.entries);
    const expectedAvg = Number(
      (before.totalDistance! / before.totalTimerTime!).toFixed(3),
    );

    const updated = applyAverageSpeed(doc.entries, {
      timeBase: 'timer',
      syncDistanceCurve: true,
    });
    const { bytes, warnings } = encodeFit({
      entries: updated,
      developerFields: doc.developerFields,
    });
    expect(warnings).toEqual([]);

    const decoded = decodeFit(bytes, 'avg-speed.fit');
    const after = computeTrackSummary(decoded.entries);
    expect(after.avgSpeed).toBeCloseTo(expectedAvg, 2);
    expect(after.maxSpeed).toBeCloseTo(expectedAvg, 2);

    const records = decoded.entries.filter(
      (e) => e.mesgNum === Profile.MesgNum.RECORD,
    );
    expect(records.length).toBe(120);
    for (const r of records) {
      expect(r.mesg.enhancedSpeed).toBeCloseTo(expectedAvg, 2);
    }
    // Synced distance curve starts at 0 and ends at totalDistance
    expect(records[0].mesg.distance).toBeCloseTo(0, 1);
    expect(records[records.length - 1].mesg.distance).toBeCloseTo(
      before.totalDistance!,
      0,
    );
  });

  it('edits total distance and scales or averages speed accordingly', () => {
    const doc = decodeFit(demoBytes, 'demo.fit');
    const before = computeTrackSummary(doc.entries);
    const targetMeters = 10_000;

    // 1. Scale speed proportionally
    const scaled = editTotalDistance(doc.entries, {
      targetDistanceMeters: targetMeters,
      speedPolicy: 'scale',
    });
    const scaledEncoded = encodeFit({
      entries: scaled,
      developerFields: doc.developerFields,
    });
    const scaledDecoded = decodeFit(scaledEncoded.bytes);
    const scaledSummary = computeTrackSummary(scaledDecoded.entries);

    expect(scaledSummary.totalDistance).toBeCloseTo(targetMeters, 0);
    const ratio = targetMeters / before.totalDistance!;
    expect(scaledSummary.avgSpeed!).toBeCloseTo(before.avgSpeed! * ratio, 2);

    // 2. Average speed on distance edit
    const averaged = editTotalDistance(doc.entries, {
      targetDistanceMeters: targetMeters,
      speedPolicy: 'average',
      syncDistanceCurve: true,
    });
    const avgSummary = computeTrackSummary(averaged);
    expect(avgSummary.totalDistance).toBeCloseTo(targetMeters, 0);
    expect(avgSummary.avgSpeed).toBeCloseTo(
      targetMeters / before.totalTimerTime!,
      2,
    );
    expect(avgSummary.maxSpeed).toBeCloseTo(
      targetMeters / before.totalTimerTime!,
      2,
    );

    // 3. Strip speed on distance edit
    const stripped = editTotalDistance(doc.entries, {
      targetDistanceMeters: targetMeters,
      speedPolicy: 'strip',
    });
    const strippedSummary = computeTrackSummary(stripped);
    expect(strippedSummary.totalDistance).toBeCloseTo(targetMeters, 0);
    expect(strippedSummary.channels.speed.present).toBe(false);

    // 4. Strip distance completely
    const noDist = stripDistance(doc.entries);
    const noDistSummary = computeTrackSummary(noDist);
    expect(noDistSummary.totalDistance).toBeNull();
  });

  it('edits activity sport and subSport across session and laps and round-trips cleanly', () => {
    const doc = decodeFit(demoBytes, 'demo.fit');
    const updated = editActivityType(doc.entries, {
      sport: 'running',
      subSport: 'treadmill',
    });

    const { bytes, warnings } = encodeFit({
      entries: updated,
      developerFields: doc.developerFields,
    });
    expect(warnings).toEqual([]);

    const decoded = decodeFit(bytes, 'treadmill.fit');
    const summary = computeTrackSummary(decoded.entries);
    expect(summary.sport).toBe('running');
    expect(summary.subSport).toBe('treadmill');

    const laps = decoded.entries.filter((e) => e.mesgNum === Profile.MesgNum.LAP);
    expect(laps.length).toBe(2);
    for (const lap of laps) {
      expect(lap.mesg.sport).toBe('running');
      expect(lap.mesg.subSport).toBe('treadmill');
    }
  });
});
