import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Table as TableIcon, Hash, AlertCircle, Info } from 'lucide-react';

/**
 * Calculates the cyclotomic coset of an element i modulo n with base q.
 */
function getCyclotomicCoset(i: number, q: number, n: number): number[] {
  if (n <= 0) return [];
  const coset = new Set<number>();
  let current = ((i % n) + n) % n;
  let iterations = 0;
  const maxIterations = 10000;
  while (!coset.has(current) && iterations < maxIterations) {
    coset.add(current);
    current = (current * q) % n;
    iterations++;
  }
  return Array.from(coset).sort((a, b) => a - b);
}

/**
 * Returns a list of all unique cyclotomic cosets for length n and base q.
 */
function getAllCosets(q: number, n: number) {
  const visited = new Set<number>();
  const cosets: { leader: number; members: number[] }[] = [];
  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) {
      const members = getCyclotomicCoset(i, q, n);
      cosets.push({ leader: i, members });
      members.forEach(m => visited.add(m));
    }
  }
  return cosets;
}

export default function App() {
  const [q, setQ] = useState<number>(3);
  const [m, setM] = useState<number>(3);

  const results = useMemo(() => {
    try {
      const n1 = Math.pow(q, m) - 1;
      const n2 = 2 * n1;

      if (n1 <= 0 || n2 <= 0 || n1 > 10000) {
        return { error: n1 > 10000 ? "Parameters too large for computation" : "Invalid parameters" };
      }

      const cosetsN2 = getAllCosets(q, n2);
      const displayedN1Leaders = new Set<number>();

      const rows = cosetsN2.map(c => {
        const valModShifted = c.leader % n1;
        const n1Coset = getCyclotomicCoset(valModShifted, q, n1);
        const n1Leader = Math.min(...n1Coset);
        
        let cosetN1ToShow = null;
        // Only show the n1 coset if its leader hasn't been displayed before
        // and if s % n1 is actually the leader of its mod n1 coset
        if (!displayedN1Leaders.has(n1Leader) && valModShifted === n1Leader) {
          cosetN1ToShow = n1Coset;
          displayedN1Leaders.add(n1Leader);
        }
        
        return {
          s: c.leader,
          cosetN2: c.members,
          cosetN1: cosetN1ToShow
        };
      });

      return { n1, n2, rows };
    } catch (e) {
      return { error: "An unexpected error occurred" };
    }
  }, [q, m]);

  const formatCoset = (members: number[] | null) => {
    if (!members) return null;
    return `{${members.join(', ')}}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header - Minimal & Clean */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">C</div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-800">Cyclotomic Coset Calculator</h1>
        </div>
        <div className="hidden md:flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <span>Algebraic Coding</span>
          <span className="text-slate-200">|</span>
          <span>v1.0.4</span>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full flex flex-col gap-8">
        {/* Parameters Section - Minimalist card */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
            <div className="md:col-span-1 space-y-3">
              <label htmlFor="q" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                Parameter q (Base)
              </label>
              <div className="relative">
                <input
                  id="q"
                  type="number"
                  value={q}
                  onChange={(e) => setQ(Math.max(2, parseInt(e.target.value) || 0))}
                  className="w-full pl-4 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                  placeholder="e.g. 3"
                />
              </div>
            </div>
            
            <div className="md:col-span-1 space-y-3">
              <label htmlFor="m" className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">
                Parameter m (Degree)
              </label>
              <div className="relative">
                <input
                  id="m"
                  type="number"
                  value={m}
                  onChange={(e) => setM(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full pl-4 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
                  placeholder="e.g. 3"
                />
              </div>
            </div>

            <div className="hidden md:block md:col-span-2 pl-8 border-l border-slate-100 h-full flex flex-col justify-center">
              <div className="flex gap-2 items-start text-xs text-slate-400 leading-relaxed italic">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-300" />
                <p>
                  Computes q-cyclotomic cosets modulo <br />
                  <span className="font-semibold text-slate-500 underline decoration-slate-200 underline-offset-2">n₁ = qᵐ - 1</span> and 
                  <span className="font-semibold text-slate-500 underline decoration-slate-200 underline-offset-2 ml-1">n₂ = 2(qᵐ - 1)</span>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Error State */}
        <AnimatePresence>
          {results.error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{results.error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        {!results.error && results.rows && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 flex-1 min-h-0"
          >
            <div className="flex justify-between items-end px-2">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Coset Computation Results</h3>
                <p className="text-[10px] text-slate-400 font-mono">MODULO COMPARISON MATRIX</p>
              </div>
              <div className="flex gap-4">
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                  n₁ = {results.n1}
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                  n₂ = {results.n2}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest w-40">
                        Leader (s)
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">
                        Coset Cₛ (mod {results.n2})
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-widest">
                        Coset Cₛ (mod {results.n1})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.rows.map((row, idx) => (
                      <motion.tr
                        key={`${q}-${m}-${row.s}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.01 }}
                        className="hover:bg-slate-50/50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-blue-600">
                          {row.s}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 font-medium">
                          {formatCoset(row.cosetN2)}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500">
                          {formatCoset(row.cosetN1) || (
                            <span className="text-slate-200 pointer-events-none">—</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex items-center gap-3 justify-center text-[10px] text-slate-400 uppercase tracking-widest pb-10">
              <span className="w-8 h-[1px] bg-slate-200"></span>
              Analysis derived from Cyclotomic Theory
              <span className="w-8 h-[1px] bg-slate-200"></span>
            </div>
          </motion.div>
        )}
      </main>

      {/* Minimalist Footer */}
      <footer className="bg-white border-t border-slate-200 px-8 py-4 flex justify-between items-center text-[10px] text-slate-400 font-medium font-mono uppercase tracking-[0.1em]">
        <div className="flex gap-6">
          <span>Field: F_q^m</span>
          <span>Cyclotomic Split Analysis</span>
        </div>
        <div className="hidden sm:block">
          BCH Code Parameters Generator
        </div>
      </footer>
    </div>
  );
}


