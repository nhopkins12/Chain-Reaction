const DEFAULTS = {
    minOverlap: 2,
    minWordLength: 3,
    maxWordLength: undefined,
    maxSteps: undefined,
    allowReuse: false,
};
export function normalizeWord(w) {
    return w.replace(/[^A-Za-z]/g, "").toUpperCase();
}
export function getOverlap(next, prev, minOverlap = 2) {
    const upNext = normalizeWord(next);
    const upPrev = normalizeWord(prev);
    const max = upPrev.length - 1;
    for (let len = max; len >= minOverlap; len--) {
        const suffix = upPrev.slice(upPrev.length - len);
        if (upNext.startsWith(suffix))
            return len;
    }
    return 0;
}
export function fusedLength(chain) {
    if (!chain.length)
        return 0;
    let total = normalizeWord(chain[0].word).length;
    for (let i = 1; i < chain.length; i++) {
        const w = normalizeWord(chain[i].word);
        total += Math.max(0, w.length - (chain[i].overlap || 0));
    }
    return total;
}
function buildPrefixIndex(words) {
    const idx = new Map();
    for (const raw of words) {
        const w = normalizeWord(raw);
        // index all prefixes of length >= 2 for adjacency lookup
        for (let len = 2; len <= w.length; len++) {
            const p = w.slice(0, len);
            const arr = idx.get(p);
            if (arr)
                arr.push(w);
            else
                idx.set(p, [w]);
        }
    }
    return idx;
}
function filterDict(words, opts) {
    const out = [];
    const seen = new Set();
    for (const raw of words) {
        const w = normalizeWord(raw);
        if (!w)
            continue;
        if (seen.has(w))
            continue;
        if (w.length < opts.minWordLength)
            continue;
        if (opts.maxWordLength && w.length > opts.maxWordLength)
            continue;
        seen.add(w);
        out.push(w);
    }
    return out;
}
export function solve(startWord, endWord, dictionary, options = {}) {
    const opts = { ...DEFAULTS, ...options };
    const start = normalizeWord(startWord);
    const end = normalizeWord(endWord);
    if (!start || !end)
        return null;
    // Prepare dictionary
    let dict = filterDict(dictionary, opts);
    if (!dict.includes(start))
        dict = [start, ...dict];
    if (!dict.includes(end))
        dict = [end, ...dict];
    const prefixIdx = buildPrefixIndex(dict);
    const nodes = [];
    const queue = [];
    const visited = new Map(); // key: word|depth -> best fused so far
    const pushNode = (n) => {
        const idx = nodes.push(n) - 1;
        queue.push(idx);
        return idx;
    };
    // Seed
    pushNode({
        word: start,
        depth: 0,
        fused: start.length,
        prevIdx: null,
        overlap: 0,
        used: new Set([start]),
    });
    let bestIdx = null;
    let bestDepth = null;
    while (queue.length) {
        const idx = queue.shift();
        const cur = nodes[idx];
        // If we already found end at this depth, don't expand deeper
        if (bestDepth !== null && cur.depth >= bestDepth) {
            if (cur.word === end) {
                if (bestIdx === null || cur.fused < nodes[bestIdx].fused) {
                    bestIdx = idx;
                }
            }
            continue;
        }
        if (cur.word === end) {
            bestIdx = idx;
            bestDepth = cur.depth;
            continue; // also consider other end nodes at same depth already in queue
        }
        if (opts.maxSteps && cur.depth >= opts.maxSteps) {
            continue;
        }
        // Expand neighbors: for each suffix of current word with length >= minOverlap
        const w = cur.word;
        for (let len = w.length - 1; len >= opts.minOverlap; len--) {
            const suffix = w.slice(w.length - len);
            const nexts = prefixIdx.get(suffix);
            if (!nexts || nexts.length === 0)
                continue;
            for (const cand of nexts) {
                if (!opts.allowReuse && cur.used.has(cand))
                    continue;
                const overlap = len; // by construction
                const fusedNext = cur.fused + (cand.length - overlap);
                const nextDepth = cur.depth + 1;
                const vKey = `${cand}|${nextDepth}`;
                const prevBest = visited.get(vKey);
                if (prevBest !== undefined && prevBest <= fusedNext)
                    continue;
                visited.set(vKey, fusedNext);
                const used = new Set(cur.used);
                used.add(cand);
                pushNode({
                    word: cand,
                    depth: nextDepth,
                    fused: fusedNext,
                    prevIdx: idx,
                    overlap,
                    used,
                });
            }
        }
    }
    if (bestIdx === null)
        return null;
    // Reconstruct chain
    const chain = [];
    let i = bestIdx;
    while (i !== null) {
        const node = nodes[i];
        chain.push({ word: node.word, overlap: node.overlap });
        i = node.prevIdx;
    }
    chain.reverse();
    // normalize start node overlap to 0
    if (chain.length)
        chain[0].overlap = 0;
    return { chain, steps: chain.length - 1, characters: fusedLength(chain) };
}
export function isValidMove(prev, next, dictionary, options = {}) {
    const opts = { ...DEFAULTS, ...options };
    const p = normalizeWord(prev);
    const nextNorm = normalizeWord(next);
    if (!p || !nextNorm)
        return { valid: false, reason: "Empty or invalid characters" };
    const dict = new Set(filterDict(dictionary, opts));
    if (!dict.has(nextNorm))
        return { valid: false, reason: "Word not in dictionary" };
    const overlap = getOverlap(nextNorm, p, opts.minOverlap);
    if (!overlap)
        return { valid: false, reason: "Does not link", overlap: 0 };
    return { valid: true, overlap };
}
