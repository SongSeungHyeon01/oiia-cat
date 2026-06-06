const { calcKps, kpsToRate } = require('../src/speed');

describe('calcKps', () => {
  test('타임스탬프 없으면 0 반환', () => {
    expect(calcKps([], 1000)).toBe(0);
  });

  test('2초 윈도우 내 이벤트 수 / 2 반환', () => {
    const now = 3000;
    // 5개 이벤트, 모두 now - 2000ms 이내
    const ts = [1100, 1500, 2000, 2500, 3000];
    expect(calcKps(ts, now)).toBe(2.5);
  });

  test('2초 이전 이벤트는 무시', () => {
    const now = 3000;
    const ts = [500, 2100, 2500, 3000]; // 500은 너무 오래됨
    expect(calcKps(ts, now)).toBe(1.5); // 3개 / 2
  });
});

describe('kpsToRate', () => {
  test('medium: 4 KPS → rate 1.0', () => {
    expect(kpsToRate(4, 'medium')).toBeCloseTo(1.0);
  });

  test('low: 6 KPS → rate 1.0', () => {
    expect(kpsToRate(6, 'low')).toBeCloseTo(1.0);
  });

  test('high: 2.5 KPS → rate 1.0', () => {
    expect(kpsToRate(2.5, 'high')).toBeCloseTo(1.0);
  });

  test('최대 3.0으로 클램프', () => {
    expect(kpsToRate(999, 'medium')).toBe(3.0);
  });

  test('최소 0으로 클램프', () => {
    expect(kpsToRate(0, 'medium')).toBe(0);
  });
});
