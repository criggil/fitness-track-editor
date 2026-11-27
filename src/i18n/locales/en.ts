export const en = {
  // Common & units
  'unit.km': 'km',
  'unit.kmh': 'km/h',
  'unit.pace': '/km',
  'unit.m': 'm',
  'unit.bpm': 'bpm',
  'unit.w': 'W',
  'unit.kcal': 'kcal',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.apply': 'Apply',
  'common.delete': 'Delete',
  'common.back': 'Previous',
  'common.next': 'Next',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.language': 'Language',

  // App header & tabs
  'app.title': 'FIT Track Editor',
  'app.editsCount': '{count} edit(s)',
  'app.messagesSummary': '{messages} FIT messages · {records} points',
  'app.undoTooltip': 'Undo (Ctrl/Cmd+Z)',
  'app.redoTooltip': 'Redo (Ctrl/Cmd+Shift+Z)',
  'app.resetTooltip': 'Reset all changes',
  'app.openAnother': 'Open another',
  'app.exportFit': 'Export .fit',
  'tab.overview': 'Overview (Map & Charts)',
  'tab.scenarios': 'Scenarios',
  'tab.raw': 'Raw FIT Data ({count})',

  // DropZone
  'dropzone.badge': '100% Local-First in browser · Files never leave your device',
  'dropzone.subtitle':
    'View and edit binary .fit tracks (Wahoo, Garmin, Strava, Zwift). Strip GPS / Elevation / Speed, calibrate distance, adjust speed & calories while preserving other FIT messages.',
  'dropzone.prompt': 'Drag & drop a .fit file here or click to browse',
  'dropzone.sdkNote': 'Powered by the official @garmin/fitsdk',
  'dropzone.loadDemo': 'Load demo track (.fit)',

  // SummaryBar
  'summary.distance': 'Distance',
  'summary.laps': '{count} lap(s)',
  'summary.timerTime': 'Timer Time',
  'summary.elapsedTime': 'elapsed: {value}',
  'summary.avgSpeed': 'Avg Speed',
  'summary.ascent': 'Elevation Gain',
  'summary.descent': 'descent: {value}',
  'summary.elevationPresent': 'Elevation present',
  'summary.elevationStripped': 'Elevation stripped',
  'summary.gpsTrack': 'GPS Track',
  'summary.points': '{count} points',
  'summary.hrPower': 'HR / Power',
  'summary.avgPowerSub': '{value} W avg',
  'summary.recordsCount': '{count} records',
  'summary.calories': 'Calories',
  'summary.was': 'was: {value}',

  // TrackMap
  'map.noGpsTitle': 'No GPS coordinates',
  'map.noGpsDesc':
    'This FIT file contains no GPS points (or the GPS section was stripped). The map is unavailable, but all other charts and FIT fields remain editable.',
  'map.gpsPoints': '{count} GPS points',

  // TelemetryCharts
  'charts.time': 'Time',
  'charts.speed': 'Speed',
  'charts.elevation': 'Elevation',
  'charts.distance': 'Distance',
  'charts.heartRate': 'Heart Rate',
  'charts.power': 'Power',
  'charts.pointsMeta': '{count} pts · {unit}',
  'charts.empty':
    'No numeric telemetry charts to display (all channels are missing or stripped).',

  // Scenarios navigation
  'scenarios.nav.strip.title': 'Strip Data Sections',
  'scenarios.nav.strip.sub': 'GPS, Elevation, Speed, HR, HRV, Power…',
  'scenarios.nav.distance.title': 'Distance Calibration',
  'scenarios.nav.distance.sub': 'Scale distance + recalculate speed',
  'scenarios.nav.speed.title': 'Average Speed from Distance',
  'scenarios.nav.speed.sub': 'Flat speed + sync distance curve',
  'scenarios.nav.indoor.title': 'Convert to Indoor',
  'scenarios.nav.indoor.sub': 'Combo: strip GPS/Elev + type + speed',
  'scenarios.nav.calories.title': 'Calories (totalCalories)',
  'scenarios.nav.calories.sub': 'Auto-estimate (Power/HR/Dist/MET) or manual',
  'scenarios.nav.activityType.title': 'Activity Type (Sport)',
  'scenarios.nav.activityType.sub': 'Change sport & subSport across sections',
  'scenarios.nav.recalculate.title': 'Recalculate Summary from Records',
  'scenarios.nav.recalculate.sub': 'Sync session & lap totals with records',

  // Scenario: Strip
  'scenarios.strip.title': 'Strip Data Sections',
  'scenarios.strip.desc':
    'Removes selected channels from record messages and cleans up related summary fields in lap and session.',
  'scenarios.strip.stripCore': 'Strip GPS + Elevation + Speed',
  'scenarios.strip.missing': 'absent',
  'scenarios.strip.ch.gps.label': 'GPS (coordinates & bounds)',
  'scenarios.strip.ch.gps.desc':
    'Removes positionLat/Long, gpsAccuracy from records and start/end/nec/swc from laps & sessions.',
  'scenarios.strip.ch.elevation.label': 'Elevation (altitude & grade)',
  'scenarios.strip.ch.elevation.desc':
    'Removes altitude/enhancedAltitude/grade from records and totalAscent/Descent, min/avg/maxAltitude from laps & sessions.',
  'scenarios.strip.ch.speed.label': 'Speed',
  'scenarios.strip.ch.speed.desc':
    'Removes speed/enhancedSpeed from records and avg/maxSpeed from laps & sessions.',
  'scenarios.strip.ch.heartRate.label': 'Heart Rate',
  'scenarios.strip.ch.heartRate.desc':
    'Removes heartRate from records, min/avg/maxHeartRate from laps/sessions, and standalone hr messages.',
  'scenarios.strip.ch.hrv.label': 'HRV (heart rate variability)',
  'scenarios.strip.ch.hrv.desc':
    'Completely removes standalone hrv messages from the FIT file.',
  'scenarios.strip.ch.power.label': 'Power',
  'scenarios.strip.ch.power.desc':
    'Removes power, accumulatedPower, leftRightBalance and normalizedPower, totalWork summaries.',
  'scenarios.strip.ch.cadence.label': 'Cadence',
  'scenarios.strip.ch.cadence.desc':
    'Removes cadence/fractionalCadence from records and avg/maxCadence from laps & sessions.',
  'scenarios.strip.ch.temperature.label': 'Temperature',
  'scenarios.strip.ch.temperature.desc':
    'Removes temperature from records and min/avg/maxTemperature from laps & sessions.',

  // Scenario: Distance
  'scenarios.distance.title': 'Distance Calibration & Speed Recalculation',
  'scenarios.distance.current': 'Current distance: {value}. Proportionally updates record.distance, lap.totalDistance, and session.totalDistance.',
  'scenarios.distance.targetLabel': 'Target total distance (km)',
  'scenarios.distance.policyLabel': 'How to update speed:',
  'scenarios.distance.policy.scale': 'Scale proportionally (preserve speed profile)',
  'scenarios.distance.policy.average': 'Fill with uniform average speed',
  'scenarios.distance.policy.strip': 'Strip speed completely',
  'scenarios.distance.policy.keep': 'Keep speed untouched',
  'scenarios.distance.syncCurve':
    'Flatten record.distance curve (so Strava also shows a flat speed chart)',
  'scenarios.distance.apply': 'Apply new distance',
  'scenarios.distance.stripAll': 'Remove Distance completely',

  // Scenario: Average Speed
  'scenarios.speed.title': 'Average Speed from Total Distance',
  'scenarios.speed.desc':
    'Replaces all speed values in record, lap, and session messages with a uniform average speed.',
  'scenarios.speed.timerTime': 'Timer time',
  'scenarios.speed.elapsedTime': 'Elapsed time',
  'scenarios.speed.previewLabel': 'Calculated average speed:',
  'scenarios.speed.needDistance': 'Distance required',
  'scenarios.speed.syncCurve':
    'Synchronize record.distance curve with average speed (recommended for Strava)',
  'scenarios.speed.apply': 'Set average speed',
  'scenarios.speed.stripAll': 'Strip speed completely',

  // Scenario: Indoor combo
  'scenarios.indoor.title': 'Convert to Indoor Workout (Combo)',
  'scenarios.indoor.desc':
    'In one step: strips GPS and Elevation, sets activity type to indoor cycling or treadmill, and aligns distance & speed.',
  'scenarios.indoor.cycling': 'Indoor Cycling',
  'scenarios.indoor.treadmill': 'Treadmill Run',
  'scenarios.indoor.distanceLabel': 'Distance (km, leave empty to keep)',
  'scenarios.indoor.speedModeLabel': 'Speed mode',
  'scenarios.indoor.speed.average': 'Flatten to average speed',
  'scenarios.indoor.speed.strip': 'Strip speed',
  'scenarios.indoor.speed.keep': 'Keep speed',
  'scenarios.indoor.apply': 'Apply Indoor scenario',

  // Scenario: Calories
  'scenarios.calories.title': 'Calories (totalCalories)',
  'scenarios.calories.current': 'Current session value: {value}. Also distributes proportionally across lap.totalCalories.',
  'scenarios.calories.notSet': 'not set',
  'scenarios.calories.autoTitle': 'Auto-estimate by formula',
  'scenarios.calories.weight': 'Weight (kg)',
  'scenarios.calories.age': 'Age',
  'scenarios.calories.sex': 'Sex',
  'scenarios.calories.male': 'Male',
  'scenarios.calories.female': 'Female',
  'scenarios.calories.method': 'Calculation method',
  'scenarios.calories.method.power': 'By Power (1 kJ ≈ 1 kcal)',
  'scenarios.calories.method.heartRate': 'By Heart Rate (Keytel 2005)',
  'scenarios.calories.method.distance': 'By Distance & Weight (Margaria)',
  'scenarios.calories.method.met': 'By Activity Type & Time (MET)',
  'scenarios.calories.estimate': 'Estimate:',
  'scenarios.calories.noData': 'not enough data for this method',
  'scenarios.calories.applyEstimate': 'Write estimate',
  'scenarios.calories.manualLabel': 'Or enter manually (kcal)',
  'scenarios.calories.setManual': 'Set',
  'scenarios.calories.strip': 'Remove calories',

  // Scenario: Activity Type
  'scenarios.activity.title': 'Activity Type (sport / subSport)',
  'scenarios.activity.desc':
    'Updates sport and subSport across all session, lap, and sport messages.',
  'scenarios.activity.sport': 'Sport',
  'scenarios.activity.subSport': 'Sub-sport',
  'scenarios.activity.apply': 'Apply activity type',

  // Activity presets
  'preset.cycling-road': 'Road Cycling',
  'preset.cycling-indoor': 'Indoor Cycling',
  'preset.cycling-virtual': 'Virtual Ride',
  'preset.cycling-gravel': 'Gravel',
  'preset.cycling-mtb': 'MTB',
  'preset.running': 'Running',
  'preset.running-treadmill': 'Treadmill',
  'preset.running-trail': 'Trail Run',
  'preset.walking': 'Walking',
  'preset.hiking': 'Hiking',
  'preset.swimming-lap': 'Lap Swim',
  'preset.strength': 'Strength',

  // Scenario: Recalculate
  'scenarios.recalc.title': 'Recalculate session & lap from records',
  'scenarios.recalc.desc':
    'Useful after manual edits in Raw FIT Data or for fixing broken files: recalculates totalDistance, avg/maxSpeed, totalAscent/Descent, avg/maxHeartRate, avg/maxPower, avg/maxCadence, and GPS bounding box from actual records. Stale summary fields for missing channels are removed.',
  'scenarios.recalc.apply': 'Recalculate all totals now',

  // Raw FIT Editor
  'raw.recalcButton': 'Recalculate totals from records',
  'raw.recalcTooltip': 'Recompute session and lap aggregates from current records',
  'raw.searchPlaceholder': 'Search field (e.g. totalCalories, speed)…',
  'raw.populatedCounter': 'Set: {set} / {total} in FIT Profile',
  'raw.populatedCounterShort': 'Set: {set}',
  'raw.hideUnset': 'Hide unset fields',
  'raw.bulkColumnInfo': 'Column {column} ({count} {mesg} rows)',
  'raw.bulkPlaceholder': 'Value or factor…',
  'raw.bulkFill': 'Fill all',
  'raw.bulkMultiply': 'Multiply ×',
  'raw.bulkDelete': 'Delete column',
  'raw.itemSelector': 'Entry:',
  'raw.noMatchingFields': 'No fields matching "{query}".',
  'raw.noMessages': 'No messages of the selected type.',
  'raw.colField': 'Field (FIT Profile)',
  'raw.colType': 'Type / Units',
  'raw.colValue': 'Value (click to edit)',
  'raw.colAction': 'Action',
  'raw.deleteOption': '— (delete)',
  'raw.enterValue': 'Enter value…',
  'raw.addValue': '— add value',
  'raw.deleteFieldTooltip': 'Delete field {field}',
  'raw.colHeaderTooltip': 'Click for bulk column actions (delete / fill / scale)',
  'raw.cellTooltip': 'Click to edit cell',
  'raw.pagination': 'Showing {from}–{to} of {total} · Click column header for bulk actions',

  // Store history / errors
  'store.decodeError': 'Failed to read .fit file.',
  'store.stripChannel': 'Stripped channel {channel}',
  'store.stripMultiple': 'Stripped channels: {channels}',
  'store.avgSpeed': 'Applied average speed from distance',
  'store.editDistance': 'Distance updated to {km} km',
  'store.stripDistance': 'Removed distance fields',
  'store.activityType': 'Activity type: {sport}',
  'store.activityTypeSub': 'Activity type: {sport} ({subSport})',
  'store.setCalories': 'Calories set to {kcal} kcal',
  'store.stripCalories': 'Removed calorie fields',
  'store.indoorCycling': 'Converted to Indoor Cycling',
  'store.indoorTreadmill': 'Converted to Treadmill Run',
  'store.recalcSummary': 'Recalculated session & lap totals from records',
  'store.rawDelete': 'Deleted {mesg}.{field}',
  'store.rawEdit': 'Edited {mesg}.{field}',
  'store.bulkDelete': 'Deleted {field} in all {mesg}',
  'store.bulkFill': 'Filled {field} in all {mesg}',
  'store.bulkScale': 'Scaled {field} (×{factor}) in all {mesg}',
  'store.undo': 'Undone: {label}',
  'store.redo': 'Redone: {label}',
  'store.reset': 'Reset to original file',
} as const;

export type TranslationKey = keyof typeof en;
export type TranslationDictionary = Record<TranslationKey, string>;
