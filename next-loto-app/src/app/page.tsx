"use client";

import { useEffect, useState } from "react";
import Head from "next/head";

// Types
type DrawData = {
  date: string;
  numbers: number[];
  joker?: number;
};

type LotoData = {
  loto649: DrawData[];
  joker: DrawData[];
};

export default function Home() {
  const [data, setData] = useState<LotoData | null>(null);
  const [game, setGame] = useState<"649" | "joker">("649");
  const [strategy, setStrategy] = useState<string>("random");
  const [numTickets, setNumTickets] = useState<number>(1);
  const [generated, setGenerated] = useState<DrawData[]>([]);


  const padNum = (num: number) => num.toString().padStart(2, '0');

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === "Generated") return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
    return dateStr;
  };


  useEffect(() => {
    fetch((process.env.NODE_ENV === "production" ? "/loto" : "") + "/data/results.json?t=" + new Date().getTime())
      .then((res) => res.json())
      .then((d: LotoData) => setData(d))
      .catch((e) => console.error("Error loading data:", e));
  }, []);

  const getFrequency = (draws: DrawData[], isJokerNumber = false, maxNum: number) => {
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

  const pickRandom = (count: number, max: number) => {
    const picked = new Set<number>();
    while (picked.size < count) {
      picked.add(Math.floor(Math.random() * max) + 1);
    }
    return Array.from(picked);
  };

  const pickFromList = (count: number, list: { num: number; count: number }[], topN: number, maxNum: number) => {
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

  const generate649 = () => {
    const draws = data?.loto649 || [];
    if (strategy === "random" || draws.length === 0) {
      return { numbers: pickRandom(6, 49), date: "Generated" };
    }

    const freq = getFrequency(draws, false, 49);
    let nums: number[] = [];

    if (strategy === "hot") nums = pickFromList(6, freq, 15, 49);
    else if (strategy === "cold") nums = pickFromList(6, [...freq].reverse(), 15, 49);
    else if (strategy === "balanced") {
      const hots = pickFromList(2, freq, 10, 49);
      const colds = pickFromList(2, [...freq].reverse(), 10, 49);
      const rand = pickRandom(2, 49);
      const all = new Set([...hots, ...colds, ...rand]);
      while (all.size < 6) all.add(Math.floor(Math.random() * 49) + 1);
      nums = Array.from(all).slice(0, 6);
    }

    return { numbers: nums, date: "Generated" };
  };

  const generateJoker = () => {
    const draws = data?.joker || [];
    if (strategy === "random" || draws.length === 0) {
      return { numbers: pickRandom(5, 45), joker: pickRandom(1, 20)[0], date: "Generated" };
    }

    const freq = getFrequency(draws, false, 45);
    const jokerFreq = getFrequency(draws, true, 20);
    let nums: number[] = [];
    let jkr: number = 0;

    if (strategy === "hot") {
      nums = pickFromList(5, freq, 15, 45);
      jkr = pickFromList(1, jokerFreq, 5, 20)[0];
    } else if (strategy === "cold") {
      nums = pickFromList(5, [...freq].reverse(), 15, 45);
      jkr = pickFromList(1, [...jokerFreq].reverse(), 5, 20)[0];
    } else if (strategy === "balanced") {
      const hots = pickFromList(2, freq, 10, 45);
      const colds = pickFromList(2, [...freq].reverse(), 10, 45);
      const rand = pickRandom(1, 45);
      const all = new Set([...hots, ...colds, ...rand]);
      while (all.size < 5) all.add(Math.floor(Math.random() * 45) + 1);
      nums = Array.from(all).slice(0, 5);

      const type = Math.random();
      if (type < 0.33) jkr = pickFromList(1, jokerFreq, 5, 20)[0];
      else if (type < 0.66) jkr = pickFromList(1, [...jokerFreq].reverse(), 5, 20)[0];
      else jkr = pickRandom(1, 20)[0];
    }

    return { numbers: nums, joker: jkr, date: "Generated" };
  };

  useEffect(() => {
    if (data && generated.length === 0) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  const handleGenerate = () => {
    const res: DrawData[] = [];
    for (let i = 0; i < numTickets; i++) {
      if (game === "649") res.push(generate649());
      else res.push(generateJoker());
    }
    setGenerated(res);
  };

  const checkWin = (ticket: DrawData, draws: DrawData[]) => {
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


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Head>
        <title>Loto 6/49 & Joker Generator</title>
      </Head>

      <main className="max-w-4xl mx-auto p-6">
        <header className="text-center mb-10 mt-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Lottery Number Generator</h1>
          <p className="text-gray-600">Smart combinations for Loto 6/49 and Joker based on historical data</p>
        </header>

        {/* Latest Results */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Previous 5 Wins</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-8 justify-center">
              {/* Loto 6/49 */}
              <div className="flex-1 text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">Loto 6/49</h3>
                <div className="space-y-4">
                  {data?.loto649?.slice(0, 5).map((draw, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className="text-sm font-medium text-gray-500 mb-1">{formatDate(draw.date)}</span>
                      <div className="flex gap-2 justify-center">
                        {draw.numbers.map((n, i) => (
                          <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-inner text-sm md:text-base">{padNum(n)}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Joker */}
              <div className="flex-1 text-center mt-6 md:mt-0 md:border-l md:border-gray-200 md:pl-8">
                <h3 className="text-lg font-semibold text-red-600 mb-4 border-b pb-2">Joker</h3>
                <div className="space-y-4">
                  {data?.joker?.slice(0, 5).map((draw, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className="text-sm font-medium text-gray-500 mb-1">{formatDate(draw.date)}</span>
                      <div className="flex gap-2 justify-center">
                        {draw.numbers.map((n, i) => (
                          <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-inner text-sm md:text-base">{padNum(n)}</div>
                        ))}
                        <div className="text-gray-400 font-bold self-center px-1">+</div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold shadow-inner text-sm md:text-base">
                          {draw.joker !== undefined ? padNum(draw.joker) : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Generator Controls */}
        <section className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 mb-8">
          <div className="flex justify-center gap-4 mb-8">
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${game === "649" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              onClick={() => { setGame("649"); setGenerated([]); }}
            >
              Loto 6/49
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${game === "joker" ? "bg-red-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              onClick={() => { setGame("joker"); setGenerated([]); }}
            >
              Joker
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-end mb-8">
            <div className="flex flex-col w-full md:w-auto">
              <label className="text-sm font-medium text-gray-600 mb-2">Generation Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="random">Pure Random</option>
                <option value="hot">Hot Numbers (Most Drawn)</option>
                <option value="cold">Cold Numbers (Least Drawn)</option>
                <option value="balanced">Balanced (Mix)</option>
              </select>
            </div>

            <div className="flex flex-col w-full md:w-auto">
              <label className="text-sm font-medium text-gray-600 mb-2">Number of Tickets</label>
              <input
                type="number"
                min="1" max="20"
                value={numTickets}
                onChange={(e) => setNumTickets(parseInt(e.target.value) || 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-32"
              />
            </div>

            <button
              onClick={handleGenerate}
              className="px-8 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md transition-colors w-full md:w-auto h-[42px]"
            >
              Generate Numbers
            </button>
          </div>

          {/* Generated Results */}
          {generated.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Your Lucky Tickets</h3>
              {generated.map((ticket, idx) => {
                const drawsToCheck = game === "649" ? data?.loto649?.slice(0, 5) : data?.joker?.slice(0, 5);
                const winStatus = drawsToCheck ? checkWin(ticket, drawsToCheck) : { matched: 0, joker: false, date: "" };
                const isWin = game === "649" ? winStatus.matched >= 3 : (winStatus.matched >= 1 && winStatus.joker) || winStatus.matched >= 3;

                return (
                  <div key={idx} className={`flex flex-col md:flex-row items-center gap-6 p-4 rounded-lg border ${isWin ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <span className="text-gray-500 font-medium w-20">Ticket {idx + 1}</span>
                    <div className="flex gap-2">
                      {ticket.numbers.sort((a,b) => a-b).map((n, i) => {
                        const isMatched = drawsToCheck?.some(d => d.date === winStatus.date && d.numbers.includes(n));
                        return (
                          <div key={i} className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-white flex items-center justify-center font-bold shadow-sm ${isMatched && isWin ? 'bg-green-500 ring-2 ring-green-300' : 'bg-blue-400'}`}>{padNum(n)}</div>
                        );
                      })}
                      {ticket.joker !== undefined && (
                        <>
                          <div className="text-gray-400 font-bold self-center px-1">+</div>
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-white flex items-center justify-center font-bold shadow-sm ${winStatus.joker && isWin ? 'bg-green-500 ring-2 ring-green-300' : 'bg-red-400'}`}>
                            {padNum(ticket.joker)}
                          </div>
                        </>
                      )}
                    </div>
                    {isWin && (
                      <div className="ml-auto flex flex-col items-end text-sm">
                        <span className="text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full">Winner! 🎉</span>
                        <span className="text-green-700 mt-1">Matched {winStatus.matched} {winStatus.joker ? "+ Joker" : ""} (Draw: {formatDate(winStatus.date)})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="text-center py-8 text-gray-400 text-sm">
        <p>Data automatically fetched from official sources every Thursday and Sunday.</p>
        <p className="mt-2">For entertainment purposes only.</p>
      </footer>
    </div>
  );
}
