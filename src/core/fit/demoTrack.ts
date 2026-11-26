import { Encoder, Profile, type Mesg } from '@garmin/fitsdk';
import { DEGREES_TO_SEMICIRCLES } from './codec';

/**
 * Generates a realistic valid binary .FIT activity (~10 km cycling loop, 2 laps, 600 points)
 * using @garmin/fitsdk Encoder. Used for unit tests and the UI "Load Demo .fit" button.
 */
export function createDemoFitBytes(options?: {
  pointCount?: number;
  startDate?: Date;
}): Uint8Array {
  const pointCount = options?.pointCount ?? 600;
  const startTimeMs = (options?.startDate ?? new Date('2026-05-10T08:00:00Z')).getTime();

  const encoder = new Encoder();
  const write = (mesgNum: number, mesg: Record<string, unknown>) => {
    encoder.onMesg(mesgNum, mesg as Mesg);
  };
  const startDate = new Date(startTimeMs);

  write(Profile.MesgNum.FILE_ID, {
    type: 'activity',
    manufacturer: 'wahooFitness',
    product: 1,
    serialNumber: 12345678,
    timeCreated: startDate,
  });

  write(Profile.MesgNum.EVENT, {
    timestamp: startDate,
    event: 'timer',
    eventType: 'start',
  });

  // Loop around a park (approx 10 km over 600 seconds at ~16.7 m/s? Let's make 1200s or 3s interval = 30 min = 1800s)
  const stepSec = 3;
  const centerLat = 52.5145;
  const centerLon = 13.3501;
  const radiusLat = 0.0145;
  const radiusLon = 0.0235;

  let cumulativeDistance = 0;
  let totalAscent = 0;
  let totalDescent = 0;
  let prevAltitude = 42;
  let sumSpeed = 0;
  let maxSpeed = 0;
  let sumHr = 0;
  let maxHr = 0;
  let sumPower = 0;
  let maxPower = 0;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  const lapMidIndex = Math.floor(pointCount / 2);
  let lap1Distance = 0;
  let lap1Ascent = 0;
  let lap1Descent = 0;
  let lap1SpeedSum = 0;
  let lap1MaxSpeed = 0;

  let startLat = 0;
  let startLon = 0;
  let midLat = 0;
  let midLon = 0;
  let endLat = 0;
  let endLon = 0;

  for (let i = 0; i < pointCount; i++) {
    const t = i / (pointCount - 1);
    const angle = t * Math.PI * 2;
    const timestamp = new Date(startTimeMs + i * stepSec * 1000);

    const lat = centerLat + Math.sin(angle) * radiusLat;
    const lon = centerLon + Math.cos(angle) * radiusLon;
    if (i === 0) {
      startLat = lat;
      startLon = lon;
    }
    if (i === lapMidIndex) {
      midLat = lat;
      midLon = lon;
    }
    endLat = lat;
    endLon = lon;

    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);

    // Smooth undulating elevation (35m .. 95m)
    const altitude = 55 + Math.sin(angle * 2) * 24 + Math.cos(angle * 3) * 10;
    const deltaAlt = altitude - prevAltitude;
    if (i > 0) {
      if (deltaAlt > 0) totalAscent += deltaAlt;
      else totalDescent += Math.abs(deltaAlt);
    }
    prevAltitude = altitude;

    // Speed fluctuates between ~4.5 m/s (climb) and ~9.5 m/s (descent)
    const speed = Math.max(3.5, 6.2 - Math.cos(angle * 2) * 1.8 + Math.sin(angle * 5) * 0.4);
    if (i > 0) {
      cumulativeDistance += speed * stepSec;
    }

    const heartRate = Math.round(138 + Math.sin(angle * 2) * 16 + t * 10);
    const power = Math.round(210 + Math.cos(angle * 2) * 45 + Math.sin(angle * 4) * 15);
    const cadence = Math.round(86 + Math.sin(angle * 3) * 6);
    const temperature = 18;

    sumSpeed += speed;
    maxSpeed = Math.max(maxSpeed, speed);
    sumHr += heartRate;
    maxHr = Math.max(maxHr, heartRate);
    sumPower += power;
    maxPower = Math.max(maxPower, power);

    if (i <= lapMidIndex) {
      lap1Distance = cumulativeDistance;
      lap1Ascent = totalAscent;
      lap1Descent = totalDescent;
      lap1SpeedSum += speed;
      lap1MaxSpeed = Math.max(lap1MaxSpeed, speed);
    }

    write(Profile.MesgNum.RECORD, {
      timestamp,
      positionLat: Math.round(lat * DEGREES_TO_SEMICIRCLES),
      positionLong: Math.round(lon * DEGREES_TO_SEMICIRCLES),
      distance: Number(cumulativeDistance.toFixed(2)),
      altitude: Number(altitude.toFixed(1)),
      enhancedAltitude: Number(altitude.toFixed(1)),
      speed: Number(speed.toFixed(3)),
      enhancedSpeed: Number(speed.toFixed(3)),
      heartRate,
      power,
      cadence,
      temperature,
    });
  }

  const totalTimeSec = (pointCount - 1) * stepSec;
  const endDate = new Date(startTimeMs + totalTimeSec * 1000);
  const midDate = new Date(startTimeMs + lapMidIndex * stepSec * 1000);

  write(Profile.MesgNum.EVENT, {
    timestamp: endDate,
    event: 'timer',
    eventType: 'stopAll',
  });

  const lap1Time = lapMidIndex * stepSec;
  const lap2Time = totalTimeSec - lap1Time;
  const lap2Distance = cumulativeDistance - lap1Distance;

  write(Profile.MesgNum.LAP, {
    timestamp: midDate,
    startTime: startDate,
    startPositionLat: Math.round(startLat * DEGREES_TO_SEMICIRCLES),
    startPositionLong: Math.round(startLon * DEGREES_TO_SEMICIRCLES),
    endPositionLat: Math.round(midLat * DEGREES_TO_SEMICIRCLES),
    endPositionLong: Math.round(midLon * DEGREES_TO_SEMICIRCLES),
    totalElapsedTime: lap1Time,
    totalTimerTime: lap1Time,
    totalDistance: Number(lap1Distance.toFixed(2)),
    avgSpeed: Number((lap1SpeedSum / (lapMidIndex + 1)).toFixed(3)),
    enhancedAvgSpeed: Number((lap1SpeedSum / (lapMidIndex + 1)).toFixed(3)),
    maxSpeed: Number(lap1MaxSpeed.toFixed(3)),
    enhancedMaxSpeed: Number(lap1MaxSpeed.toFixed(3)),
    totalAscent: Math.round(lap1Ascent),
    totalDescent: Math.round(lap1Descent),
    sport: 'cycling',
  });

  const lap2AvgSpeed = lap2Time > 0 ? lap2Distance / lap2Time : 0;
  write(Profile.MesgNum.LAP, {
    timestamp: endDate,
    startTime: midDate,
    startPositionLat: Math.round(midLat * DEGREES_TO_SEMICIRCLES),
    startPositionLong: Math.round(midLon * DEGREES_TO_SEMICIRCLES),
    endPositionLat: Math.round(endLat * DEGREES_TO_SEMICIRCLES),
    endPositionLong: Math.round(endLon * DEGREES_TO_SEMICIRCLES),
    totalElapsedTime: lap2Time,
    totalTimerTime: lap2Time,
    totalDistance: Number(lap2Distance.toFixed(2)),
    avgSpeed: Number(lap2AvgSpeed.toFixed(3)),
    enhancedAvgSpeed: Number(lap2AvgSpeed.toFixed(3)),
    maxSpeed: Number(maxSpeed.toFixed(3)),
    enhancedMaxSpeed: Number(maxSpeed.toFixed(3)),
    totalAscent: Math.round(totalAscent - lap1Ascent),
    totalDescent: Math.round(totalDescent - lap1Descent),
    sport: 'cycling',
  });

  const avgSpeed = sumSpeed / pointCount;
  write(Profile.MesgNum.SESSION, {
    timestamp: endDate,
    startTime: startDate,
    startPositionLat: Math.round(startLat * DEGREES_TO_SEMICIRCLES),
    startPositionLong: Math.round(startLon * DEGREES_TO_SEMICIRCLES),
    necLat: Math.round(maxLat * DEGREES_TO_SEMICIRCLES),
    necLong: Math.round(maxLon * DEGREES_TO_SEMICIRCLES),
    swcLat: Math.round(minLat * DEGREES_TO_SEMICIRCLES),
    swcLong: Math.round(minLon * DEGREES_TO_SEMICIRCLES),
    sport: 'cycling',
    subSport: 'road',
    totalElapsedTime: totalTimeSec,
    totalTimerTime: totalTimeSec,
    totalDistance: Number(cumulativeDistance.toFixed(2)),
    avgSpeed: Number(avgSpeed.toFixed(3)),
    enhancedAvgSpeed: Number(avgSpeed.toFixed(3)),
    maxSpeed: Number(maxSpeed.toFixed(3)),
    enhancedMaxSpeed: Number(maxSpeed.toFixed(3)),
    totalAscent: Math.round(totalAscent),
    totalDescent: Math.round(totalDescent),
    avgHeartRate: Math.round(sumHr / pointCount),
    maxHeartRate: maxHr,
    avgPower: Math.round(sumPower / pointCount),
    maxPower: maxPower,
    numLaps: 2,
  });

  write(Profile.MesgNum.ACTIVITY, {
    timestamp: endDate,
    totalTimerTime: totalTimeSec,
    numSessions: 1,
    type: 'manual',
    event: 'activity',
    eventType: 'stop',
  });

  return encoder.close();
}
