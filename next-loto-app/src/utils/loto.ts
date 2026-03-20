import { DrawData, SimulationStats } from "../types/loto";

export const getFrequency = (draws: DrawData[], isJokerNumber = false, maxNum: number) => {
  const freq: Record<number, number> = {};
  for (let i = 1; i <= maxNum; i++) freq[i] = 0;

  draws.forEach((d) => {
    if (isJokerNumber && d.joker !== undefined) {
      freq[d.joker] = (freq[d.joker] || 0) + 1;
    } else {
      d.numbers.forEach((n) => {
        freq[n] = (freq[n] || 0) + 1;
      });
    }
  });

  return Object.entries(freq)
    .map(([num, count]) => ({ num: parseInt(num), count }))
    .sort((a, b) => b.count - a.count);
};

export const pickRandom = (count: number, max: number) => {
  const picked = new Set<number>();
  while (picked.size < count) {
    picked.add(Math.floor(Math.random() * max) + 1);
  }
  return Array.from(picked);
};

export const pickFromList = (count: number, list: { num: number; count: number }[], topN: number, maxNum: number) => {
  const pool = list.slice(0, topN).map((x) => x.num);
  const picked = new Set<number>();
  while (picked.size < count) {
    if (pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.add(pool[idx]);
      pool.splice(idx, 1);
    } else {
      picked.add(Math.floor(Math.random() * maxNum) + 1);
    }
  }
  return Array.from(picked);
};

export const generate649 = (draws: DrawData[], strategy: string) => {
  if (strategy === "random" || draws.length === 0) {
    return { numbers: pickRandom(6, 49), date: "Generated" };
  }

  const freq = getFrequency(draws, false, 49);
  const reversedFreq = (strategy === "cold" || strategy === "balanced") ? [...freq].reverse() : [];
  let nums: number[] = [];

  if (strategy === "hot") nums = pickFromList(6, freq, 15, 49);
  else if (strategy === "cold") nums = pickFromList(6, reversedFreq, 15, 49);
  else if (strategy === "balanced") {
    const hots = pickFromList(2, freq, 10, 49);
    const colds = pickFromList(2, reversedFreq, 10, 49);
    const rand = pickRandom(2, 49);
    const all = new Set([...hots, ...colds, ...rand]);
    while (all.size < 6) all.add(Math.floor(Math.random() * 49) + 1);
    nums = Array.from(all).slice(0, 6);
  } else if (strategy === "odd_even") {
    const odds = freq.filter(f => f.num % 2 !== 0);
    const evens = freq.filter(f => f.num % 2 === 0);
    const pickedOdds = pickFromList(3, odds, 10, 49);
    const pickedEvens = pickFromList(3, evens, 10, 49);
    const all = new Set([...pickedOdds, ...pickedEvens]);
    while (all.size < 6) all.add(Math.floor(Math.random() * 49) + 1);
    nums = Array.from(all).slice(0, 6);
  } else if (strategy === "high_low") {
    const lows = freq.filter(f => f.num <= 24);
    const highs = freq.filter(f => f.num > 24);
    const pickedLows = pickFromList(3, lows, 10, 49);
    const pickedHighs = pickFromList(3, highs, 10, 49);
    const all = new Set([...pickedLows, ...pickedHighs]);
    while (all.size < 6) all.add(Math.floor(Math.random() * 49) + 1);
    nums = Array.from(all).slice(0, 6);
  }

  return { numbers: nums, date: "Generated" };
};

export const generateJoker = (draws: DrawData[], strategy: string) => {
  if (strategy === "random" || draws.length === 0) {
    return { numbers: pickRandom(5, 45), joker: pickRandom(1, 20)[0], date: "Generated" };
  }

  const freq = getFrequency(draws, false, 45);
  const jokerFreq = getFrequency(draws, true, 20);
  const reversedFreq = (strategy === "cold" || strategy === "balanced") ? [...freq].reverse() : [];
  const reversedJokerFreq = (strategy === "cold" || strategy === "balanced") ? [...jokerFreq].reverse() : [];
  let nums: number[] = [];
  let jkr: number = 0;

  if (strategy === "hot") {
    nums = pickFromList(5, freq, 15, 45);
    jkr = pickFromList(1, jokerFreq, 5, 20)[0];
  } else if (strategy === "odd_even") {
    const odds = freq.filter(f => f.num % 2 !== 0);
    const evens = freq.filter(f => f.num % 2 === 0);
    const pickedOdds = pickFromList(3, odds, 10, 45);
    const pickedEvens = pickFromList(2, evens, 10, 45);
    const all = new Set([...pickedOdds, ...pickedEvens]);
    while (all.size < 5) all.add(Math.floor(Math.random() * 45) + 1);
    nums = Array.from(all).slice(0, 5);

    const jokerOdds = jokerFreq.filter(f => f.num % 2 !== 0);
    const jokerEvens = jokerFreq.filter(f => f.num % 2 === 0);
    const isJokerOdd = Math.random() > 0.5;
    jkr = isJokerOdd ? pickFromList(1, jokerOdds, 5, 20)[0] : pickFromList(1, jokerEvens, 5, 20)[0];
    if (!jkr) jkr = pickRandom(1, 20)[0];
  } else if (strategy === "high_low") {
    const lows = freq.filter(f => f.num <= 22);
    const highs = freq.filter(f => f.num > 22);
    const pickedLows = pickFromList(3, lows, 10, 45);
    const pickedHighs = pickFromList(2, highs, 10, 45);
    const all = new Set([...pickedLows, ...pickedHighs]);
    while (all.size < 5) all.add(Math.floor(Math.random() * 45) + 1);
    nums = Array.from(all).slice(0, 5);

    const jokerLows = jokerFreq.filter(f => f.num <= 10);
    const jokerHighs = jokerFreq.filter(f => f.num > 10);
    const isJokerLow = Math.random() > 0.5;
    jkr = isJokerLow ? pickFromList(1, jokerLows, 5, 20)[0] : pickFromList(1, jokerHighs, 5, 20)[0];
    if (!jkr) jkr = pickRandom(1, 20)[0];
  } else if (strategy === "cold") {
    nums = pickFromList(5, reversedFreq, 15, 45);
    jkr = pickFromList(1, reversedJokerFreq, 5, 20)[0];
  } else if (strategy === "balanced") {
    const hots = pickFromList(2, freq, 10, 45);
    const colds = pickFromList(2, reversedFreq, 10, 45);
    const rand = pickRandom(1, 45);
    const all = new Set([...hots, ...colds, ...rand]);
    while (all.size < 5) all.add(Math.floor(Math.random() * 45) + 1);
    nums = Array.from(all).slice(0, 5);

    const type = Math.random();
    if (type < 0.33) jkr = pickFromList(1, jokerFreq, 5, 20)[0];
    else if (type < 0.66) jkr = pickFromList(1, reversedJokerFreq, 5, 20)[0];
    else jkr = pickRandom(1, 20)[0];
  }

  return { numbers: nums, joker: jkr, date: "Generated" };
};

export const checkWin = (ticket: DrawData, draws: DrawData[]) => {
  let bestMatch = { matched: 0, joker: false, date: "" };

  draws.forEach(draw => {
    let matched = 0;
    ticket.numbers.forEach(n => {
      if (draw.numbers.includes(n)) matched++;
    });
    const jokerMatch = ticket.joker !== undefined && ticket.joker === draw.joker;

    // Update best match logic
    if (matched > bestMatch.matched || (matched === bestMatch.matched && jokerMatch && !bestMatch.joker)) {
      bestMatch = { matched, joker: jokerMatch, date: draw.date };
    }
  });

  return bestMatch;
};

export const calculateSimulation = (
  game: "649" | "joker",
  history: DrawData[],
  simDrawsCount: number,
  simNumTickets: number,
  simStrategy: string
): SimulationStats | null => {
  // We can't simulate if we don't have enough history
  // We need at least some history BEFORE the draw we are simulating
  const drawsToSimulate = Math.min(simDrawsCount, history.length - 1);
  if (drawsToSimulate <= 0) return null;

  let totalCost = 0;
  let estimatedWin = 0;
  const wins: Record<string, number> = {};

  // history[0] is newest. history[history.length-1] is oldest.
  // To simulate draw T, we can only use draws from T+1 to end.
  for (let t = drawsToSimulate - 1; t >= 0; t--) {
    const actualDraw = history[t];
    const availableHistory = history.slice(t + 1);

    for (let i = 0; i < simNumTickets; i++) {
      const ticket = game === "649" ? generate649(availableHistory, simStrategy) : generateJoker(availableHistory, simStrategy);
      const match = checkWin(ticket, [actualDraw]); // check against the single actual draw

      totalCost += game === "649" ? 7 : 6; // roughly 7 RON for 6/49, 6 for Joker

      const isWin = game === "649"
        ? match.matched >= 3
        : (match.matched >= 1 && match.joker) || match.matched >= 3;

      if (isWin) {
        const winCategory = game === "649"
          ? `${match.matched} numbers`
          : `${match.matched} numbers ${match.joker ? '+ Joker' : ''}`;

        wins[winCategory] = (wins[winCategory] || 0) + 1;

        // Rough estimation of winnings (in RON)
        if (game === "649") {
          if (match.matched === 3) estimatedWin += 30;
          if (match.matched === 4) estimatedWin += 200;
          if (match.matched === 5) estimatedWin += 20000;
          if (match.matched === 6) estimatedWin += 5000000;
        } else {
          if (match.matched === 1 && match.joker) estimatedWin += 15;
          if (match.matched === 2 && match.joker) estimatedWin += 30;
          if (match.matched === 3 && !match.joker) estimatedWin += 50;
          if (match.matched === 3 && match.joker) estimatedWin += 500;
          if (match.matched === 4 && !match.joker) estimatedWin += 2000;
          if (match.matched === 4 && match.joker) estimatedWin += 20000;
          if (match.matched === 5 && !match.joker) estimatedWin += 100000;
          if (match.matched === 5 && match.joker) estimatedWin += 2000000;
        }
      }
    }
  }

  return {
    totalDrawsSimulated: drawsToSimulate,
    totalTicketsGenerated: drawsToSimulate * simNumTickets,
    wins,
    totalCost,
    estimatedWin,
    timestamp: Date.now()
  };
};
