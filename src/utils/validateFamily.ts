import type { Person, Relationship } from '@/lib/familyTreeTypes';

export function validateFamily(people: Person[], relationships: Relationship[]) {
  const errs: string[] = [];
  const byId = new Map(people.map(p => [p.id, p]));

  const spousePairs = new Set<string>();
  const parentsOf = new Map<string, string[]>();
  relationships.forEach(r => {
    if (r.relationship_type === 'spouse') {
      const key = [r.from_person_id, r.to_person_id].sort().join('-');
      spousePairs.add(key);
    } else if (r.relationship_type === 'parent') {
      const arr = parentsOf.get(r.to_person_id) ?? [];
      arr.push(r.from_person_id);
      parentsOf.set(r.to_person_id, arr);
    }
  });

  // 1) Check for suspicious spouse relationships (siblings marrying each other)
  relationships.forEach(r => {
    if (r.relationship_type === 'spouse') {
      const a = byId.get(r.from_person_id)?.full_name ?? r.from_person_id;
      const b = byId.get(r.to_person_id)?.full_name ?? r.to_person_id;
      
      // Only flag if they share the same parents (siblings marrying)
      const aParents = parentsOf.get(r.from_person_id) ?? [];
      const bParents = parentsOf.get(r.to_person_id) ?? [];
      
      if (aParents.length > 0 && bParents.length > 0) {
        const sharedParents = aParents.filter(p => bParents.includes(p));
        if (sharedParents.length > 0) {
          errs.push(`Suspicious spouse link between siblings: ${a} ↔ ${b}`);
        }
      }
    }
  });

  // 2) each child should have 1–2 parents; if 2, they should be a spouse pair (or union without heart)
  parentsOf.forEach((ps, childId) => {
    if (ps.length === 0) errs.push(`Child has no parents: ${byId.get(childId)?.full_name}`);
    if (ps.length > 2) errs.push(`Child has >2 parents: ${byId.get(childId)?.full_name}`);
    if (ps.length === 2) {
      const key = [...ps].sort().join('-');
      // ok if spouse pair or union (we don't force explicit)
      // but if *neither* spouse nor both parents exist, warn:
      if (!byId.get(ps[0]) || !byId.get(ps[1])) {
        errs.push(`Child has missing parent record: ${byId.get(childId)?.full_name}`);
      }
    }
  });

  // 3) age sanity (if years exist)
  parentsOf.forEach((ps, childId) => {
    const c = byId.get(childId);
    if (!c?.birth_year) return;
    ps.forEach(pid => {
      const p = byId.get(pid);
      if (p?.birth_year && p.birth_year > c.birth_year) {
        errs.push(`Parent younger than child: ${p.full_name} (${p.birth_year}) > ${c.full_name} (${c.birth_year})`);
      }
    });
  });

  return errs;
}