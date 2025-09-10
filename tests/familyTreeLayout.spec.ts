import { describe, it, expect } from 'vitest';
import { FamilyTreeLayoutEngine } from '@/utils/familyTreeLayoutEngine';
import type { Person, Relationship } from '@/lib/familyTreeTypes';

const now = new Date().toISOString();
const fam = 'test-family';

// helpers
const P = (id: string, name: string, birth_year?: number): Person => ({
  id, family_id: fam, full_name: name,
  created_at: now, updated_at: now,
  birth_year,
  // optional fields omitted
});

const spouse = (a: string, b: string): Relationship => ({
  id: `${a}-${b}-sp`, family_id: fam,
  from_person_id: a, to_person_id: b,
  relationship_type: 'spouse', created_at: now,
});

const parent = (p: string, c: string): Relationship => ({
  id: `${p}->${c}`, family_id: fam,
  from_person_id: p, to_person_id: c,
  relationship_type: 'parent', created_at: now,
});

describe('FamilyTreeLayoutEngine — org-chart invariants', () => {
  // People (IDs match your app)
  const people: Person[] = [
    P('robert',  'Robert Bird',               1940),
    P('mary',    'Mary Bird',                 1945),
    P('john',    'John Bird',                 1970),
    P('sarah',   'Sarah Bird Johnson',        1975),
    P('michael', 'Michael Johnson',           1972),
    P('simon',   'Simon Bird',                1978),
    P('zuzana',  'Zuzana Bird',               1983),
    P('james',   'James Johnson',             2005),
    P('emma',    'Emma Bird',                 2000),
  ];

  // Truth-set relationships
  const relationships: Relationship[] = [
    spouse('robert','mary'),
    spouse('sarah','michael'),
    spouse('simon','zuzana'),

    parent('robert','john'),   parent('mary','john'),
    parent('robert','sarah'),  parent('mary','sarah'),
    parent('robert','simon'),  parent('mary','simon'),

    parent('sarah','james'),   parent('michael','james'),
    parent('simon','emma'),    parent('zuzana','emma'),
  ];

  // Use the same spacing as engine defaults so we can assert geometry
  const CONFIG = {
    personWidth: 160,
    personHeight: 100,
    gridX: 220,
    gridY: 170,
    spouseGap: 40,
    siblingGap: 40,
    childGap: 180,
    padding: 100,
    minGap: 40,
  };

  const get = (arr: any[], id: string) => {
    const n = arr.find((x: any) => x.person?.id === id || x.id === id);
    if (!n) throw new Error(`Missing node: ${id}`);
    return n;
  };

  it('renders perfect generational rows, spouse pairs, and child centering', () => {
    const eng = new FamilyTreeLayoutEngine(CONFIG);
    const { nodes, marriages } = eng.generateLayout(people, relationships);

    const byId = Object.fromEntries(nodes.map(n => [n.person.id, n]));
    const depth = (id: string) => byId[id].depth;
    const y = (id: string) => byId[id].y;
    const xCenter = (id: string) => byId[id].x + CONFIG.personWidth / 2;

    // 1) Generational rows (top to bottom)
    expect(depth('robert')).toBe(0);
    expect(depth('mary')).toBe(0);

    // Gen 2
    expect(depth('john')).toBe(1);
    expect(depth('sarah')).toBe(1);
    expect(depth('michael')).toBe(1);
    expect(depth('simon')).toBe(1);
    expect(depth('zuzana')).toBe(1);

    // Gen 3
    expect(depth('james')).toBe(2);
    expect(depth('emma')).toBe(2);

    // 2) Spouses on the same row
    expect(y('robert')).toBe(y('mary'));
    expect(y('sarah')).toBe(y('michael'));
    expect(y('simon')).toBe(y('zuzana'));

    // 3) Hearts only for explicit marriages
    marriages.forEach(m => {
      if (m.parentA && m.parentB) {
        // these 3 must be explicit hearts
        const ids = [m.parentA.id, m.parentB.id].sort().join('-');
        const shouldBeHeart = ['mary-robert','michael-sarah','simon-zuzana'].includes(ids);
        expect(m.explicit).toBe(shouldBeHeart);
      }
    });

    // 4) Child centering under union midpoint (allow small tolerance)
    const tol = CONFIG.gridX / 4;

    const sm = marriages.find(m =>
      (m.parentA?.id === 'simon' && m.parentB?.id === 'zuzana') ||
      (m.parentA?.id === 'zuzana' && m.parentB?.id === 'simon')
    )!;
    const emmaCenter = xCenter('emma');
    expect(Math.abs(emmaCenter - sm.x)).toBeLessThanOrEqual(tol);

    const sj = marriages.find(m =>
      (m.parentA?.id === 'sarah' && m.parentB?.id === 'michael') ||
      (m.parentA?.id === 'michael' && m.parentB?.id === 'sarah')
    )!;
    const jamesCenter = xCenter('james');
    expect(Math.abs(jamesCenter - sj.x)).toBeLessThanOrEqual(tol);

    // 5) No overlaps within a row (simple sweep)
    const rows: Record<number, typeof nodes> = {};
    nodes.forEach(n => {
      rows[n.depth] ||= [];
      rows[n.depth].push(n);
    });
    Object.values(rows).forEach(row => {
      const sorted = row.slice().sort((a,b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].x - sorted[i-1].x;
        expect(gap).toBeGreaterThanOrEqual(CONFIG.personWidth + CONFIG.minGap - 1); // -1 tolerance
      }
    });
  });
});