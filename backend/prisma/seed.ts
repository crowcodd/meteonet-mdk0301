/**
 * демо-данные: 2 района, 6 станций, 6 параметров, приборы, пользователи
 * и история замеров за 10 дней, чтобы было с чем сравнивать в проверках соседей и выбросов
 * последние 2 срока у WS-01 специально пустые, их удобно вносить на демо
 */
import { CheckType, InstrumentRole, InstrumentState, MeasurementStatus, Role, StationType, Verdict } from '../src/domain/enums';
import { createPrismaClient } from '../src/modules/prisma/prisma.service';

const prisma = createPrismaClient();

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const HISTORY_DAYS = 10;

// свой генератор случайных чисел с фиксированным зерном, чтобы данные всегда были одни и те же
let seed = 42;
const rand = () => ((seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
const noise = (amp: number) => (rand() * 2 - 1) * amp;

const PARAMETERS = [
  { code: 'TEMP', name: 'Температура воздуха', unit: '°C', minValue: -55, maxValue: 45, precision: 1, neighborTolerance: 4 },
  { code: 'PRESSURE', name: 'Атмосферное давление', unit: 'гПа', minValue: 940, maxValue: 1060, precision: 1, neighborTolerance: 5 },
  { code: 'HUMIDITY', name: 'Относительная влажность', unit: '%', minValue: 0, maxValue: 100, precision: 0, neighborTolerance: 15 },
  { code: 'WIND', name: 'Скорость ветра', unit: 'м/с', minValue: 0, maxValue: 60, precision: 1, neighborTolerance: 5 },
  { code: 'PRECIP', name: 'Осадки', unit: 'мм', minValue: 0, maxValue: 300, precision: 1, neighborTolerance: 8 },
  { code: 'CLOUD', name: 'Облачность', unit: 'балл', minValue: 0, maxValue: 10, precision: 0, neighborTolerance: 4 },
] as const;

type Code = (typeof PARAMETERS)[number]['code'];

/** правдоподобное значение параметра в момент t, offset сдвигает его для конкретной станции */
function valueAt(code: Code, t: number, offset: number): number {
  const hour = new Date(t).getUTCHours() + 3; // местное время, примерно UTC+3
  const daily = Math.sin(((hour - 9) / 24) * 2 * Math.PI);
  const synoptic = Math.sin(t / (3.5 * DAY));
  switch (code) {
    case 'TEMP': return 8 + 6 * daily + 3 * synoptic + offset + noise(0.8);
    case 'PRESSURE': return 1012 + 8 * synoptic + offset + noise(0.8);
    case 'HUMIDITY': return Math.min(100, Math.max(20, 72 - 15 * daily + offset * 2 + noise(4)));
    case 'WIND': return Math.max(0, 3.5 + 1.5 * synoptic + Math.abs(offset) * 0.3 + noise(1));
    case 'PRECIP': return synoptic > 0.6 ? Math.max(0, 1.5 + noise(1.2)) : 0;
    case 'CLOUD': return Math.min(10, Math.max(0, 5 + 4 * synoptic + noise(1.5)));
  }
}

const round = (v: number, precision: number) => Math.round(v * 10 ** precision) / 10 ** precision;

async function main() {
  // с флагом --if-empty заполненную базу не трогаем, так seed запускается при старте контейнера
  if (process.argv.includes('--if-empty') && (await prisma.user.count()) > 0) {
    console.log('БД уже заполнена, seed пропущен');
    return;
  }

  // чистим таблицы так, чтобы не мешали внешние ключи
  await prisma.auditLog.deleteMany();
  await prisma.checkResult.deleteMany();
  await prisma.measurementRevision.deleteMany();
  await prisma.measurement.deleteMany();
  await prisma.failureLog.deleteMany();
  await prisma.instrumentParameter.deleteMany();
  await prisma.instrument.deleteMany();
  await prisma.user.deleteMany();
  await prisma.station.deleteMany();
  await prisma.district.deleteMany();
  await prisma.parameter.deleteMany();

  const params = await Promise.all(PARAMETERS.map((p) => prisma.parameter.create({ data: p })));
  const paramByCode = new Map(params.map((p) => [p.code as Code, p]));

  const kirov = await prisma.district.create({ data: { name: 'Кировский', areaKm2: 4200 } });
  const slob = await prisma.district.create({ data: { name: 'Слободской', areaKm2: 3700 } });

  const stationsData = [
    { code: 'WS-01', name: 'Киров', type: StationType.GROUND, latitude: 58.6, longitude: 49.65, districtId: kirov.id, offset: 0 },
    { code: 'WS-02', name: 'Нововятск', type: StationType.AUTOMATIC, latitude: 58.52, longitude: 49.73, districtId: kirov.id, offset: 0.4 },
    { code: 'WS-03', name: 'Порошино', type: StationType.AEROLOGICAL, latitude: 58.55, longitude: 49.45, districtId: kirov.id, offset: -0.3 },
    { code: 'WS-04', name: 'Бахта', type: StationType.GROUND, latitude: 58.72, longitude: 49.8, districtId: kirov.id, offset: -0.6 },
    { code: 'WS-05', name: 'Слободской', type: StationType.GROUND, latitude: 58.72, longitude: 50.18, districtId: slob.id, offset: -1 },
    { code: 'WS-06', name: 'Вахруши', type: StationType.MARINE, latitude: 58.68, longitude: 50.03, districtId: slob.id, offset: -0.8 },
  ];

  const passwordHash = await Bun.password.hash('observer123');
  await prisma.user.create({
    data: {
      login: 'manager',
      passwordHash: await Bun.password.hash('manager123'),
      role: Role.MANAGER,
      fullName: 'Руководитель центра Петрова А. В.',
      contacts: '+7 (8332) 00-00-01',
    },
  });

  const now = Date.now();
  const lastTerm = Math.floor(now / (3 * HOUR)) * 3 * HOUR; // последний прошедший срок, они идут каждые 3 часа по UTC
  const firstTerm = lastTerm - HISTORY_DAYS * DAY;

  for (const [i, { offset, ...s }] of stationsData.entries()) {
    const station = await prisma.station.create({ data: s });
    const n = i + 1;
    const observer = await prisma.user.create({
      data: {
        login: `observer${n}`,
        passwordHash,
        role: Role.OBSERVER,
        fullName: `Наблюдатель станции ${s.name}`,
        contacts: `+7 (8332) 10-00-0${n}`,
        stationId: station.id,
      },
    });

    // на каждый параметр по основному прибору и ещё запасной термометр
    const instruments = new Map<Code, number>();
    const specs: [string, string, Code[], InstrumentRole, number][] = [
      ['Термометр', 'ТМ-6', ['TEMP'], InstrumentRole.PRIMARY, 200],
      ['Барометр', 'БРС-1М', ['PRESSURE'], InstrumentRole.PRIMARY, n === 2 ? -5 : 120],
      ['Гигрометр', 'М-19', ['HUMIDITY'], InstrumentRole.PRIMARY, n === 1 ? 12 : 300],
      ['Анеморумбометр', 'М-63М', ['WIND'], InstrumentRole.PRIMARY, 250],
      ['Осадкомер', 'О-1', ['PRECIP'], InstrumentRole.PRIMARY, 180],
      ['Облакомер', 'ДВО-2', ['CLOUD'], InstrumentRole.PRIMARY, 90],
      ['Термометр резервный', 'ТМ-6', ['TEMP'], InstrumentRole.RESERVE, 220],
    ];
    for (const [name, model, codes, role, verifyInDays] of specs) {
      const inst = await prisma.instrument.create({
        data: {
          name,
          model,
          stationId: station.id,
          role,
          state: InstrumentState.IN_SERVICE,
          commissionedAt: new Date(now - 400 * DAY),
          nextVerificationAt: new Date(now + verifyInDays * DAY),
          parameters: { create: codes.map((c) => ({ parameterId: paramByCode.get(c)!.id })) },
        },
      });
      if (role === InstrumentRole.PRIMARY) instruments.set(codes[0]!, inst.id);
    }

    // история за HISTORY_DAYS дней, у WS-01 без двух последних сроков
    const until = n === 1 ? lastTerm - 2 * 3 * HOUR : lastTerm;
    const rows = [];
    for (let t = firstTerm; t <= until; t += 3 * HOUR) {
      // раз в трое суток у WS-04 нет связи до 09:00 UTC, эти замеры приходят с задержкой
      const delayed = n === 4 && Math.floor((t - firstTerm) / DAY) % 3 === 1 && new Date(t).getUTCHours() < 9;
      for (const p of params) {
        rows.push({
          stationId: station.id,
          parameterId: p.id,
          instrumentId: instruments.get(p.code as Code)!,
          observedAt: new Date(t),
          receivedAt: new Date(t + (delayed ? 9 * HOUR - (new Date(t).getUTCHours() * HOUR) : 5 * 60_000)),
          delayed,
          status: MeasurementStatus.ACCEPTED,
          value: round(valueAt(p.code as Code, t, offset), p.precision),
          currentRevision: 1,
        });
      }
    }
    await prisma.measurement.createMany({ data: rows });
    const created = await prisma.measurement.findMany({ where: { stationId: station.id }, select: { id: true, value: true } });
    await prisma.measurementRevision.createMany({
      data: created.map((m) => ({ measurementId: m.id, revision: 1, value: m.value, authorId: observer.id })),
    });
  }

  await seedAnomalies(paramByCode);
  console.log('Seed готов: manager/manager123, observer1..6/observer123');
}

/** пара замеров на разборе, чтобы у руководителя и в отчёте сразу что-то было */
async function seedAnomalies(paramByCode: Map<Code, { id: number }>) {
  const manager = await prisma.user.findUniqueOrThrow({ where: { login: 'manager' } });
  const temp = paramByCode.get('TEMP')!.id;
  const humidity = paramByCode.get('HUMIDITY')!.id;

  const pick = async (stationCode: string, parameterId: number, skip: number) => {
    const station = await prisma.station.findUniqueOrThrow({ where: { code: stationCode } });
    return prisma.measurement.findFirstOrThrow({
      where: { stationId: station.id, parameterId },
      orderBy: { observedAt: 'desc' },
      skip,
    });
  };

  // на WS-03 выброс температуры, ждёт руководителя
  const flagged = await pick('WS-03', temp, 3);
  await markSuspect(flagged.id, flagged.value + 14, MeasurementStatus.FLAGGED, [CheckType.NEIGHBORS, CheckType.OUTLIER], null);

  // на WS-01 влажность 104 процента, уже вернули на станцию
  const returned = await pick('WS-01', humidity, 1);
  await markSuspect(returned.id, 104, MeasurementStatus.RETURNED, [CheckType.RANGE, CheckType.NEIGHBORS], manager.id);

  // на WS-05 ложное срабатывание, руководитель принял
  const fp = await pick('WS-05', temp, 5);
  await markSuspect(fp.id, fp.value, MeasurementStatus.ACCEPTED, [CheckType.OUTLIER], manager.id);
}

async function markSuspect(id: number, value: number, status: MeasurementStatus, suspects: CheckType[], managerId: number | null) {
  await prisma.measurement.update({ where: { id }, data: { value, status } });
  await prisma.measurementRevision.updateMany({ where: { measurementId: id, revision: 1 }, data: { value } });
  await prisma.checkResult.createMany({
    data: Object.values(CheckType).map((type) => ({
      measurementId: id,
      revision: 1,
      type,
      verdict: suspects.includes(type) ? Verdict.SUSPECT : Verdict.NORMAL,
      note: suspects.includes(type) ? 'Подозрение (демо-данные)' : 'Норма',
    })),
  });
  const trail: { fromState: string | null; toState: string; comment: string | null; actorId: number | null }[] = [
    { fromState: MeasurementStatus.DRAFT, toState: MeasurementStatus.RECEIVED, comment: null, actorId: null },
    { fromState: MeasurementStatus.RECEIVED, toState: MeasurementStatus.FLAGGED, comment: `Подозрение: ${suspects.join(', ')}`, actorId: null },
  ];
  if (status === MeasurementStatus.RETURNED) {
    trail.push({ fromState: MeasurementStatus.FLAGGED, toState: status, comment: 'Проверьте показания гигрометра', actorId: managerId });
  }
  if (status === MeasurementStatus.ACCEPTED) {
    trail.push({ fromState: MeasurementStatus.FLAGGED, toState: status, comment: 'Локальное похолодание, значение достоверно', actorId: managerId });
  }
  await prisma.auditLog.createMany({ data: trail.map((a) => ({ ...a, entity: 'Measurement', entityId: id })) });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
