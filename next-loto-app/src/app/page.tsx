"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { DrawData, LotoData, SimulationStats } from "../types/loto";
import { generate649, generateJoker, checkWin, calculateSimulation } from "../utils/loto";

export default function Home() {
  const [data, setData] = useState<LotoData | null>(null);
  const [game, setGame] = useState<"649" | "joker">("649");
  const [strategy, setStrategy] = useState<string>("random");
  const [numTickets, setNumTickets] = useState<number>(1);
  const [simStrategy, setSimStrategy] = useState<string>("random");
  const [simNumTickets, setSimNumTickets] = useState<number>(1);
  const [generated, setGenerated] = useState<DrawData[]>([]);
  const [simDrawsCount, setSimDrawsCount] = useState<number>(10);
  const [simulationStats, setSimulationStats] = useState<SimulationStats | null>(null);



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

  useEffect(() => {
    if (data && generated.length === 0) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const runSimulation = () => {
    if (!data) return;
    const history = game === "649" ? data.loto649 : data.joker;

    const stats = calculateSimulation(game, history, simDrawsCount, simNumTickets, simStrategy);
    setSimulationStats(stats);
  };

  const handleGenerate = () => {
    const res: DrawData[] = [];
    for (let i = 0; i < numTickets; i++) {
      if (game === "649") res.push(generate649(data?.loto649 || [], strategy));
      else res.push(generateJoker(data?.joker || [], strategy));
    }
    setGenerated(res);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Head>
        <title>Loto 6/49 & Joker Generator</title>
      </Head>

      <main className="max-w-6xl mx-auto p-6">
        <header className="text-center mb-10 mt-10">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Lottery Number Generator</h1>
          <p className="text-gray-600">Smart combinations for Loto 6/49 and Joker based on historical data</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main Content Area (Generator & Backtest) */}
          <div className="flex-1 order-1 lg:order-2 flex flex-col gap-8">
            {/* Generator Controls */}
        <section className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 mb-8">
          <div className="flex justify-center gap-4 mb-8">
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${game === "649" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              onClick={() => { setGame("649"); setGenerated([]); setSimulationStats(null); }}
            >
              Loto 6/49
            </button>
            <button
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${game === "joker" ? "bg-red-500 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              onClick={() => { setGame("joker"); setGenerated([]); setSimulationStats(null); }}
            >
              Joker
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-end mb-8">
            <div className="flex flex-col w-full md:w-auto">
              <label className="text-sm font-medium text-gray-600 mb-2">Generation Strategy</label>
              <select
                value={strategy}
                onChange={(e) => { setStrategy(e.target.value); setSimulationStats(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="random">Pure Random</option>
                <option value="hot">Hot Numbers (Most Drawn)</option>
                <option value="cold">Cold Numbers (Least Drawn)</option>
                <option value="balanced">Balanced (Mix)</option>
                <option value="odd_even">Odd / Even Balanced</option>
                <option value="high_low">High / Low Balanced</option>
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
              className="px-8 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg shadow-md transition-colors w-full md:w-auto "
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
            {/* Simulation Section */}
        <section className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Backtest Simulation</h2>
          <p className="text-center text-gray-600 mb-6 text-sm">
            Simulate how your chosen strategy would have performed over the last N draws.
            The algorithm only uses historical data available <b>before</b> each simulated draw.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-end mb-8">
            <div className="flex flex-col w-full md:w-auto">
              <label className="text-sm font-medium text-gray-600 mb-2">Strategy</label>
              <select
                value={simStrategy}
                onChange={(e) => setSimStrategy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="random">Pure Random</option>
                <option value="hot">Hot Numbers (Most Drawn)</option>
                <option value="cold">Cold Numbers (Least Drawn)</option>
                <option value="balanced">Balanced (Mix)</option>
                <option value="odd_even">Odd / Even Balanced</option>
                <option value="high_low">High / Low Balanced</option>
              </select>
            </div>

            <div className="flex flex-col w-full md:w-auto">
              <label className="text-sm font-medium text-gray-600 mb-2">Tickets per Draw</label>
              <input
                type="number"
                min="1" max="20"
                value={simNumTickets}
                onChange={(e) => setSimNumTickets(parseInt(e.target.value) || 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-32"
              />
            </div>

            <div className="flex flex-col w-full md:w-auto">
              <label className="text-sm font-medium text-gray-600 mb-2">Past Draws to Simulate</label>
              <input
                type="number"
                min="1" max="50"
                value={simDrawsCount}
                onChange={(e) => setSimDrawsCount(parseInt(e.target.value) || 10)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-32"
              />
            </div>

            <button
              onClick={runSimulation}
              className="px-8 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg shadow-md transition-colors w-full md:w-auto "
            >
              Run Simulation
            </button>
          </div>

          {simulationStats && (
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
              <h3 className="text-lg font-bold text-purple-900 mb-4 border-b border-purple-200 pb-2">Simulation Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-700"><span className="font-semibold">Strategy:</span> {simStrategy} ({game === "649" ? "Loto 6/49" : "Joker"})</p>
                  <p className="text-gray-700"><span className="font-semibold">Draws Simulated:</span> {simulationStats.totalDrawsSimulated}</p>
                  <p className="text-gray-700"><span className="font-semibold">Tickets Bought:</span> {simulationStats.totalTicketsGenerated} ({simNumTickets} per draw)</p>
                  <p className="text-gray-700"><span className="font-semibold">Estimated Cost:</span> {simulationStats.totalCost} RON</p>
                  <p className="text-gray-700"><span className="font-semibold">Estimated Winnings:</span> {simulationStats.estimatedWin} RON</p>
                  <p className="mt-2 font-bold text-lg">
                    Return on Investment:
                    <span className={simulationStats.estimatedWin >= simulationStats.totalCost ? "text-green-600" : "text-red-600"}>
                      {' '}{(simulationStats.estimatedWin - simulationStats.totalCost)} RON
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">Winning Tickets Generated:</p>
                  {Object.keys(simulationStats.wins).length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {Object.entries(simulationStats.wins).map(([category, count]) => (
                        <li key={category} className="text-gray-700">
                          {category}: <span className="font-bold text-green-600">{count}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No winning tickets generated in this simulation.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
          </div>

          {/* Sidebar Area (Previous Winnings) */}
          <aside className="w-full lg:w-1/3 order-2 lg:order-1">
            <div className="sticky top-6">
              {/* Latest Results */}
        <section className="bg-slate-50 rounded-xl shadow-inner p-6 border border-slate-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Previous 5 Wins</h2>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-8 justify-center">
              {/* Loto 6/49 */}
              <div className="flex-1 text-center">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">Loto 6/49</h3>
                <div className="space-y-4">
                  {data?.loto649?.slice(0, 5).map((draw, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className="text-sm font-medium text-gray-500 mb-1">{formatDate(draw.date)}</span>
                      <div className="flex gap-2 justify-center">
                        {draw.numbers.map((n, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-inner text-xs">{padNum(n)}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Joker */}
              <div className="flex-1 text-center pt-6 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-red-600 mb-4 border-b pb-2">Joker</h3>
                <div className="space-y-4">
                  {data?.joker?.slice(0, 5).map((draw, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <span className="text-sm font-medium text-gray-500 mb-1">{formatDate(draw.date)}</span>
                      <div className="flex gap-2 justify-center">
                        {draw.numbers.map((n, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-inner text-xs">{padNum(n)}</div>
                        ))}
                        <div className="text-gray-400 font-bold self-center px-1">+</div>
                        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold shadow-inner text-xs">
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
            </div>
          </aside>

        </div>








      </main>

      <footer className="text-center py-8 text-gray-400 text-sm">
        <p>Data automatically fetched from official sources every Thursday and Sunday.</p>
        <p className="mt-2">For entertainment purposes only.</p>
      </footer>
    </div>
  );
}
