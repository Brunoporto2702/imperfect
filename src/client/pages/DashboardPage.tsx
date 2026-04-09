"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { IntakeEntry, IntakeItem } from "@/server/food/core/models/food";
import { loadIntakeEntries, saveIntakeEntries } from "@/client/features/entries/intakeEntries";
import { loadIntakeItems, saveIntakeItems } from "@/client/features/entries/intakeItems";
import { loadTarget, saveTarget } from "@/client/features/profile/target";
import { loadUserId, saveUserId } from "@/client/features/profile/user";
import { migrateToCloud, fetchUserData } from "@/client/features/entries/sync";
import { getWeeklyStats, getDaySummaries, getWeeklyInsight } from "@/client/logic/entries";
import { buildWeeklyChart } from "@/client/logic/chart";
import { WeeklyCaloriesChart } from "@/client/components/WeeklyCaloriesChart";
import { EmailCaptureModal } from "@/client/components/EmailCaptureModal";

const SENTIMENT_STYLES = {
  positive: "text-green-400",
  warning: "text-amber-400",
  neutral: "text-zinc-500",
};

export function DashboardPage() {
  const [loaded, setLoaded] = useState(false);
  const [entries, setEntries] = useState<IntakeEntry[]>([]);
  const [items, setItems] = useState<IntakeItem[]>([]);
  const [target, setTarget] = useState<number | null>(null);
  const [targetInput, setTargetInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalMode, setEmailModalMode] = useState<"save" | "login">("save");

  useEffect(() => {
    async function init() {
      const userId = loadUserId();

      if (userId) {
        try {
          const { entries: cloudEntries, items: cloudItems } = await fetchUserData(userId);
          saveIntakeEntries(cloudEntries);
          saveIntakeItems(cloudItems);
          setEntries(cloudEntries);
          setItems(cloudItems);
        } catch {
          // server unavailable — fall back to local
          setEntries(loadIntakeEntries());
          setItems(loadIntakeItems());
        }
      } else {
        const localEntries = loadIntakeEntries();
        const localItems = loadIntakeItems();
        setEntries(localEntries);
        setItems(localItems);
        if (localEntries.length >= 3) {
          setEmailModalMode("save");
          setShowEmailModal(true);
        }
      }

      const stored = loadTarget();
      setTarget(stored);
      setTargetInput(stored != null ? String(stored) : "");
      setLoaded(true);
    }
    setMounted(true);
    init();
  }, []);

  async function handleEmailSuccess(userId: string, isNew: boolean) {
    saveUserId(userId);
    setShowEmailModal(false);
    setSyncing(true);
    try {
      if (isNew) {
        await migrateToCloud(userId, loadIntakeEntries(), loadIntakeItems());
      } else {
        const { entries: cloudEntries, items: cloudItems } = await fetchUserData(userId);
        saveIntakeEntries(cloudEntries);
        saveIntakeItems(cloudItems);
        setEntries(cloudEntries);
        setItems(cloudItems);
      }
    } catch {
      // non-blocking
    } finally {
      setSyncing(false);
    }
  }

  function handleTargetBlur() {
    const parsed = parseInt(targetInput, 10);
    if (!targetInput.trim() || isNaN(parsed) || parsed <= 0) {
      saveTarget(null);
      setTarget(null);
      setTargetInput("");
    } else {
      saveTarget(parsed);
      setTarget(parsed);
    }
  }

  if (!mounted) return null;

  if (!loaded || syncing) return (
    <main className="w-full max-w-xl mx-auto p-8 pb-28 animate-pulse">
      <div className="bg-zinc-900 rounded-xl p-6 mb-8">
        <div className="h-3 w-24 bg-zinc-800 rounded mb-4" />
        <div className="flex gap-8 mb-4">
          <div className="h-8 w-16 bg-zinc-800 rounded" />
          <div className="h-8 w-16 bg-zinc-800 rounded" />
        </div>
        <div className="h-3 w-40 bg-zinc-800 rounded" />
      </div>
      <div className="px-1 mb-8">
        <div className="h-24 bg-zinc-900 rounded-xl" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-4 w-20 bg-zinc-900 rounded" />
        <div className="h-4 w-full bg-zinc-900 rounded" />
        <div className="h-4 w-3/4 bg-zinc-900 rounded" />
      </div>
    </main>
  );

  const weekly = getWeeklyStats(items);
  const insight = getWeeklyInsight(items, target);
  const chartDays = buildWeeklyChart(items);
  const daySummaries = getDaySummaries(items);
  const hasItemsToday = daySummaries.length > 0 && daySummaries[0].label === "Hoje";

  return (
    <>
    {showEmailModal && (
      <EmailCaptureModal
        mode={emailModalMode}
        onSuccess={handleEmailSuccess}
        onDismiss={() => setShowEmailModal(false)}
      />
    )}
    <main className="w-full max-w-xl mx-auto p-8 pb-28">
      {items.length === 0 ? (
        <div className="flex flex-col items-center text-center py-24 gap-5 max-w-sm mx-auto">
          <p className="text-3xl font-bold text-zinc-50 leading-snug">Rastreie sem obsessão.</p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Descreva o que comeu como vier na cabeça — texto livre, foto, ou item a item.
            A gente estima calorias e proteína. Sem pesagem, sem tabela.
          </p>
          <Link
            href="/new"
            className="mt-2 bg-zinc-100 text-zinc-900 hover:bg-white transition-colors rounded-lg px-5 py-2.5 text-sm font-medium"
          >
            Registrar primeira refeição
          </Link>
          <button
            onClick={() => { setEmailModalMode("login"); setShowEmailModal(true); }}
            className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
          >
            já tenho conta — trazer meus dados
          </button>
        </div>
      ) : (
        <>
          {/* Weekly stats */}
          <div className="bg-zinc-900 rounded-xl p-6 mb-8">
            <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-4">
              Esta semana
            </h2>
            <div className="flex gap-8 mb-4">
              <div>
                <p className="text-2xl font-bold text-zinc-50">~{Math.round((weekly.calMin + weekly.calMax) / 2)}</p>
                <p className="text-xs text-zinc-500 mt-0.5">kcal</p>
              </div>
              {weekly.protein > 0 && (
                <div>
                  <p className="text-2xl font-bold text-zinc-50">{weekly.protein}g</p>
                  <p className="text-xs text-zinc-500 mt-0.5">proteína</p>
                </div>
              )}
              <div>
                <p className="text-2xl font-bold text-zinc-50">{weekly.count}</p>
                <p className="text-xs text-zinc-500 mt-0.5">itens</p>
              </div>
            </div>
            <p className={`text-xs ${SENTIMENT_STYLES[insight.sentiment]}`}>
              {insight.message}
            </p>
          </div>

          {/* Chart */}
          <div className="px-1 mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                Calorias / dia
              </p>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-zinc-600" htmlFor="daily-target">
                  Meta
                </label>
                <input
                  id="daily-target"
                  type="number"
                  min={1}
                  placeholder="kcal"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  onBlur={handleTargetBlur}
                  style={{ colorScheme: "dark" }}
                  className="w-20 text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-right text-blue-400 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
            <WeeklyCaloriesChart days={chartDays} target={target ?? undefined} />
          </div>

          {/* Prompt when no items today */}
          {!hasItemsToday && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-4">
              <span className="text-xs text-zinc-500">Sem registros hoje ainda.</span>
              <div className="flex gap-3 shrink-0">
                <Link href="/new/history" className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
                  Histórico
                </Link>
                <Link href="/new" className="text-xs text-zinc-100 hover:text-white transition-colors font-medium">
                  + Nova entrada
                </Link>
              </div>
            </div>
          )}

          {/* Day summaries */}
          <div className="flex flex-col">
            {daySummaries.map((day, idx) => (
              <div key={day.dateKey} className={idx > 0 ? "border-t border-zinc-800/50 pt-5 mt-5" : ""}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-semibold text-zinc-50">{day.label}</span>
                  <span className="text-xs text-zinc-600">
                    ~{Math.round((day.calMin + day.calMax) / 2)} kcal
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {day.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm gap-4">
                      <span className="text-zinc-400 truncate">
                        {item.quantity} {item.name}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-zinc-600">
                          ~{Math.round((item.caloriesMin + item.caloriesMax) / 2)} kcal
                          {item.protein != null && ` · ${item.protein}g`}
                        </span>
                        <Link
                          href={`/items/${item.id}`}
                          className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          editar
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      {items.length > 0 && (
        <Link
          href="/new/history"
          aria-label="Do histórico"
          className="fixed bottom-6 right-24 w-10 h-10 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M10 6.5V10l2.5 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      )}
      <Link
        href="/new"
        aria-label="Nova entrada"
        className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-100 text-zinc-900 hover:bg-white rounded-full flex items-center justify-center text-2xl shadow-lg transition-colors"
      >
        +
      </Link>
    </main>
    </>
  );
}
