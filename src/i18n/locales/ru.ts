import type { TranslationDictionary } from './en';

export const ru: TranslationDictionary = {
  // Common & units
  'unit.km': 'км',
  'unit.kmh': 'км/ч',
  'unit.pace': '/км',
  'unit.m': 'м',
  'unit.bpm': 'уд/м',
  'unit.w': 'Вт',
  'unit.kcal': 'ккал',
  'common.cancel': 'Отмена',
  'common.save': 'Сохранить',
  'common.apply': 'Применить',
  'common.delete': 'Удалить',
  'common.back': 'Назад',
  'common.next': 'Вперёд',
  'common.yes': 'Есть',
  'common.no': 'Нет',
  'common.language': 'Язык',

  // App header & tabs
  'app.title': 'FIT Track Editor',
  'app.editsCount': '{count} прав.',
  'app.messagesSummary': '{messages} FIT сообщений · {records} точек',
  'app.undoTooltip': 'Отменить (Ctrl/Cmd+Z)',
  'app.redoTooltip': 'Повторить (Ctrl/Cmd+Shift+Z)',
  'app.resetTooltip': 'Сбросить все изменения',
  'app.openAnother': 'Другой файл',
  'app.exportFit': 'Экспорт .fit',
  'tab.overview': 'Обзор (Карта и графики)',
  'tab.scenarios': 'Сценарии',
  'tab.raw': 'Сырые FIT-данные ({count})',

  // DropZone
  'dropzone.badge': '100% Local-First в браузере · Файлы не покидают ваш компьютер',
  'dropzone.subtitle':
    'Просмотр и редактирование бинарных .fit треков (Wahoo, Garmin, Strava, Zwift). Вырезание GPS / Elevation / Speed, правка дистанции, скорости и калорий с сохранением остальных сообщений FIT.',
  'dropzone.prompt': 'Перетащите .fit файл сюда или нажмите для выбора',
  'dropzone.sdkNote': 'Работает на базе официального @garmin/fitsdk',
  'dropzone.loadDemo': 'Открыть демо-трек (.fit)',

  // SummaryBar
  'summary.distance': 'Дистанция',
  'summary.laps': '{count} кр.',
  'summary.timerTime': 'Время (таймер)',
  'summary.elapsedTime': 'всего: {value}',
  'summary.avgSpeed': 'Ср. скорость',
  'summary.ascent': 'Набор высоты',
  'summary.descent': 'спуск: {value}',
  'summary.elevationPresent': 'Elevation есть',
  'summary.elevationStripped': 'Elevation вырезан',
  'summary.gpsTrack': 'GPS трек',
  'summary.points': '{count} точек',
  'summary.hrPower': 'Пульс / Мощность',
  'summary.avgPowerSub': '{value} Вт ср.',
  'summary.recordsCount': '{count} записей',
  'summary.calories': 'Калории',
  'summary.was': 'было: {value}',

  // TrackMap
  'map.noGpsTitle': 'GPS-координаты отсутствуют',
  'map.noGpsDesc':
    'В текущем FIT-файле нет GPS-точек (либо секция GPS была вырезана). Карта недоступна, но остальные графики и поля FIT можно редактировать.',
  'map.gpsPoints': '{count} GPS-точек',

  // TelemetryCharts
  'charts.time': 'Время',
  'charts.speed': 'Скорость',
  'charts.elevation': 'Высота (Elevation)',
  'charts.distance': 'Дистанция',
  'charts.heartRate': 'Пульс',
  'charts.power': 'Мощность',
  'charts.pointsMeta': '{count} точек · {unit}',
  'charts.empty':
    'Нет числовых графиков для отображения (все каналы телеметрии отсутствуют или вырезаны).',

  // Scenarios navigation
  'scenarios.nav.strip.title': 'Вырезать секции данных',
  'scenarios.nav.strip.sub': 'GPS, Elevation, Speed, HR, HRV, Power…',
  'scenarios.nav.distance.title': 'Коррекция дистанции',
  'scenarios.nav.distance.sub': 'Масштабирование + пересчёт скорости',
  'scenarios.nav.speed.title': 'Средняя скорость по дистанции',
  'scenarios.nav.speed.sub': 'Ровная скорость + синхронизация кривой',
  'scenarios.nav.indoor.title': 'Превратить в Indoor',
  'scenarios.nav.indoor.sub': 'Комбо: без GPS/высоты + тип + скорость',
  'scenarios.nav.calories.title': 'Калории (totalCalories)',
  'scenarios.nav.calories.sub': 'Авторасчёт (Power/HR/Dist/MET) или вручную',
  'scenarios.nav.activityType.title': 'Тип активности (Sport)',
  'scenarios.nav.activityType.sub': 'Смена sport и subSport во всех секциях',
  'scenarios.nav.recalculate.title': 'Пересчитать итоги из record',
  'scenarios.nav.recalculate.sub': 'Синхронизация session и lap с record',

  // Scenario: Strip
  'scenarios.strip.title': 'Вырезать секции данных',
  'scenarios.strip.desc':
    'Удаляет выбранные каналы из record и одновременно очищает связанные сводные поля в lap и session.',
  'scenarios.strip.stripCore': 'Вырезать GPS + Elevation + Speed',
  'scenarios.strip.missing': 'отсутствует',
  'scenarios.strip.ch.gps.label': 'GPS (координаты и границы)',
  'scenarios.strip.ch.gps.desc':
    'Удаляет positionLat/Long, gpsAccuracy из record и start/end/nec/swc из lap и session.',
  'scenarios.strip.ch.elevation.label': 'Elevation (высота и градиент)',
  'scenarios.strip.ch.elevation.desc':
    'Удаляет altitude/enhancedAltitude/grade из record и totalAscent/Descent, min/avg/maxAltitude из lap и session.',
  'scenarios.strip.ch.speed.label': 'Speed (скорость)',
  'scenarios.strip.ch.speed.desc':
    'Удаляет speed/enhancedSpeed из record и avg/maxSpeed из lap и session.',
  'scenarios.strip.ch.heartRate.label': 'Heart Rate (пульс)',
  'scenarios.strip.ch.heartRate.desc':
    'Удаляет heartRate из record, min/avg/maxHeartRate из lap/session и отдельные hr-сообщения.',
  'scenarios.strip.ch.hrv.label': 'HRV (вариабельность ритма)',
  'scenarios.strip.ch.hrv.desc':
    'Полностью удаляет отдельные сообщения типа hrv из FIT-файла.',
  'scenarios.strip.ch.power.label': 'Power (мощность)',
  'scenarios.strip.ch.power.desc':
    'Удаляет power, accumulatedPower, leftRightBalance и агрегаты normalizedPower, totalWork.',
  'scenarios.strip.ch.cadence.label': 'Cadence (каденс)',
  'scenarios.strip.ch.cadence.desc':
    'Удаляет cadence/fractionalCadence из record и avg/maxCadence из lap и session.',
  'scenarios.strip.ch.temperature.label': 'Temperature (температура)',
  'scenarios.strip.ch.temperature.desc':
    'Удаляет temperature из record и min/avg/maxTemperature из lap и session.',

  // Scenario: Distance
  'scenarios.distance.title': 'Коррекция дистанции с пересчётом скорости',
  'scenarios.distance.current':
    'Текущая дистанция: {value}. Пропорционально обновляет record.distance, lap.totalDistance и session.totalDistance.',
  'scenarios.distance.targetLabel': 'Целевая дистанция (км)',
  'scenarios.distance.policyLabel': 'Как пересчитать скорость:',
  'scenarios.distance.policy.scale': 'Пропорционально отмасштабировать (сохранить профиль)',
  'scenarios.distance.policy.average': 'Заполнить ровной средней скоростью',
  'scenarios.distance.policy.strip': 'Вырезать скорость полностью',
  'scenarios.distance.policy.keep': 'Не трогать скорость',
  'scenarios.distance.syncCurve':
    'Выровнять кривую record.distance (чтобы Strava тоже показывала ровную скорость)',
  'scenarios.distance.apply': 'Применить новую дистанцию',
  'scenarios.distance.stripAll': 'Удалить Distance целиком',

  // Scenario: Average Speed
  'scenarios.speed.title': 'Средняя скорость по общей дистанции',
  'scenarios.speed.desc':
    'Заменяет все значения скорости в record, lap и session на ровную среднюю скорость.',
  'scenarios.speed.timerTime': 'Timer time',
  'scenarios.speed.elapsedTime': 'Elapsed time',
  'scenarios.speed.previewLabel': 'Расчётная средняя скорость:',
  'scenarios.speed.needDistance': 'Нужна дистанция',
  'scenarios.speed.syncCurve':
    'Синхронизировать кривую record.distance со средней скоростью (рекомендуется для Strava)',
  'scenarios.speed.apply': 'Выставить среднюю скорость',
  'scenarios.speed.stripAll': 'Вырезать скорость полностью',

  // Scenario: Indoor combo
  'scenarios.indoor.title': 'Превратить в Indoor-тренировку (комбо-сценарий)',
  'scenarios.indoor.desc':
    'За один шаг вырезает GPS и Elevation, меняет тип активности на велостанок или беговую дорожку и приводит в порядок дистанцию и скорость.',
  'scenarios.indoor.cycling': 'Велостанок',
  'scenarios.indoor.treadmill': 'Беговая дорожка',
  'scenarios.indoor.distanceLabel': 'Дистанция (км, пусто — не менять)',
  'scenarios.indoor.speedModeLabel': 'Режим скорости',
  'scenarios.indoor.speed.average': 'Выровнять в среднюю',
  'scenarios.indoor.speed.strip': 'Вырезать скорость',
  'scenarios.indoor.speed.keep': 'Не трогать скорость',
  'scenarios.indoor.apply': 'Применить Indoor-сценарий',

  // Scenario: Calories
  'scenarios.calories.title': 'Калории (totalCalories)',
  'scenarios.calories.current':
    'Текущее значение в session: {value}. При записи значение также пропорционально раскладывается по lap.totalCalories.',
  'scenarios.calories.notSet': 'не задано',
  'scenarios.calories.autoTitle': 'Авторасчёт по формуле',
  'scenarios.calories.weight': 'Вес (кг)',
  'scenarios.calories.age': 'Возраст',
  'scenarios.calories.sex': 'Пол',
  'scenarios.calories.male': 'Мужской',
  'scenarios.calories.female': 'Женский',
  'scenarios.calories.method': 'Метод расчёта',
  'scenarios.calories.method.power': 'По мощности (1 кДж ≈ 1 ккал)',
  'scenarios.calories.method.heartRate': 'По пульсу (Keytel 2005)',
  'scenarios.calories.method.distance': 'По дистанции и весу (Margaria)',
  'scenarios.calories.method.met': 'По типу активности и времени (MET)',
  'scenarios.calories.estimate': 'Оценка:',
  'scenarios.calories.noData': 'нет данных для метода',
  'scenarios.calories.applyEstimate': 'Записать оценку',
  'scenarios.calories.manualLabel': 'Или ввести вручную (ккал)',
  'scenarios.calories.setManual': 'Задать',
  'scenarios.calories.strip': 'Удалить калории',

  // Scenario: Activity Type
  'scenarios.activity.title': 'Тип активности (sport / subSport)',
  'scenarios.activity.desc':
    'Обновляет sport и subSport во всех сообщениях session, lap и sport.',
  'scenarios.activity.sport': 'Sport',
  'scenarios.activity.subSport': 'Sub-sport',
  'scenarios.activity.apply': 'Применить тип активности',

  // Activity presets
  'preset.cycling-road': 'Вело (шоссе)',
  'preset.cycling-indoor': 'Велостанок',
  'preset.cycling-virtual': 'Virtual Ride',
  'preset.cycling-gravel': 'Грэвел',
  'preset.cycling-mtb': 'MTB',
  'preset.running': 'Бег',
  'preset.running-treadmill': 'Дорожка',
  'preset.running-trail': 'Трейл',
  'preset.walking': 'Ходьба',
  'preset.hiking': 'Хайкинг',
  'preset.swimming-lap': 'Бассейн',
  'preset.strength': 'Силовая',

  // Scenario: Recalculate
  'scenarios.recalc.title': 'Пересчитать итоги session и lap из record',
  'scenarios.recalc.desc':
    'Полезно после ручных правок в «Сырых FIT-данных» или для починки битых файлов: заново вычисляет totalDistance, avg/maxSpeed, totalAscent/Descent, avg/maxHeartRate, avg/maxPower, avg/maxCadence и GPS bounding box по фактическим точкам record. Устаревшие итоги отсутствующих каналов удаляются.',
  'scenarios.recalc.apply': 'Пересчитать все итоги сейчас',

  // Raw FIT Editor
  'raw.recalcButton': 'Пересчитать итоги из record',
  'raw.recalcTooltip': 'Пересчитать агрегаты session и lap на основе текущих record',
  'raw.searchPlaceholder': 'Поиск поля (например, totalCalories, speed)…',
  'raw.populatedCounter': 'Задано: {set} / {total} в FIT Profile',
  'raw.populatedCounterShort': 'Задано: {set}',
  'raw.hideUnset': 'Скрыть незаданные поля',
  'raw.bulkColumnInfo': 'Колонка {column} ({count} строк {mesg})',
  'raw.bulkPlaceholder': 'Значение или множитель…',
  'raw.bulkFill': 'Заполнить все',
  'raw.bulkMultiply': 'Умножить ×',
  'raw.bulkDelete': 'Удалить колонку',
  'raw.itemSelector': 'Запись:',
  'raw.noMatchingFields': 'Нет полей, подходящих под фильтр «{query}».',
  'raw.noMessages': 'Нет сообщений выбранного типа.',
  'raw.colField': 'Поле (FIT Profile)',
  'raw.colType': 'Тип / Ед.',
  'raw.colValue': 'Значение (нажмите для правки)',
  'raw.colAction': 'Действие',
  'raw.deleteOption': '— (удалить)',
  'raw.enterValue': 'Введите значение…',
  'raw.addValue': '— добавить значение',
  'raw.deleteFieldTooltip': 'Удалить поле {field}',
  'raw.colHeaderTooltip': 'Нажмите для массовых действий с колонкой (удалить / заполнить / масштабировать)',
  'raw.cellTooltip': 'Нажмите, чтобы изменить ячейку',
  'raw.pagination': 'Показано {from}–{to} из {total} · Клик по заголовку колонки — массовые действия',

  // Store history / errors
  'store.decodeError': 'Не удалось прочитать .fit файл.',
  'store.stripChannel': 'Вырезан канал {channel}',
  'store.stripMultiple': 'Вырезаны каналы: {channels}',
  'store.avgSpeed': 'Установлена средняя скорость по дистанции',
  'store.editDistance': 'Дистанция изменена на {km} км',
  'store.stripDistance': 'Удалены поля дистанции',
  'store.activityType': 'Тип активности: {sport}',
  'store.activityTypeSub': 'Тип активности: {sport} ({subSport})',
  'store.setCalories': 'Калории установлены: {kcal} ккал',
  'store.stripCalories': 'Удалены поля калорий',
  'store.indoorCycling': 'Конвертация в велостанок (Indoor Cycling)',
  'store.indoorTreadmill': 'Конвертация в беговую дорожку (Indoor)',
  'store.recalcSummary': 'Пересчитаны итоги session и lap из record',
  'store.rawDelete': 'Удалено {mesg}.{field}',
  'store.rawEdit': 'Изменено {mesg}.{field}',
  'store.bulkDelete': 'Удалено поле {field} во всех {mesg}',
  'store.bulkFill': 'Заполнено {field} во всех {mesg}',
  'store.bulkScale': 'Масштабировано {field} (×{factor}) во всех {mesg}',
  'store.undo': 'Отменено: {label}',
  'store.redo': 'Повторено: {label}',
  'store.reset': 'Сброс к исходному файлу',
};
