import type { DayBar } from "@/client/logic/chart";

const LEFT_PADDING = 4;
const RIGHT_LABEL_START = 274; // where right-side labels begin
const RIGHT_PADDING = 4;
const BAR_AREA_HEIGHT = 110;
const TOP_PADDING = 4;
const BOTTOM = TOP_PADDING + BAR_AREA_HEIGHT; // 114
const CHART_WIDTH = 300;
const BARS_LEFT = LEFT_PADDING;
const SLOT_STEP = 38;   // distance between bar centers' left edges
const SLOT_CENTER = 16; // half of old BAR_WIDTH — center within slot
const BOX_WIDTH = 20;
const BOX_HALF = BOX_WIDTH / 2;
const LIMIT_WIDTH = 10;
const LIMIT_HALF = LIMIT_WIDTH / 2;

function computeTicks(maxVal: number): number[] {
  const nearest = maxVal > 600 ? 100 : 50;
  const interval = Math.round(maxVal / 3 / nearest) * nearest || nearest;
  return [interval, interval * 2].filter((t) => t > 0 && t < maxVal);
}

export function WeeklyCaloriesChart({ days }: { days: DayBar[] }) {
  const maxVal = Math.max(...days.map((d) => d.calMax), 1);
  const ticks = computeTicks(maxVal);

  const activeDays = days.filter((d) => d.calMax > 0);
  const weeklyAvgMid =
    activeDays.length > 1
      ? activeDays.reduce((s, d) => s + d.calMid, 0) / activeDays.length
      : null;

  const toY = (val: number) =>
    TOP_PADDING + BAR_AREA_HEIGHT - (val / maxVal) * BAR_AREA_HEIGHT;

  return (
    <div>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${BOTTOM + 24}`} className="w-full">
        {/* gridlines */}
        {ticks.map((tick) => {
          const y = toY(tick);
          return (
            <g key={tick}>
              <line
                x1={LEFT_PADDING}
                y1={y}
                x2={RIGHT_LABEL_START - 4}
                y2={y}
                strokeWidth={0.25}
                className="stroke-zinc-700"
              />
              <text
                x={RIGHT_LABEL_START}
                y={y + 3}
                textAnchor="start"
                fontSize={8}
                className="fill-zinc-400"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* baseline */}
        <line
          x1={LEFT_PADDING}
          y1={BOTTOM}
          x2={RIGHT_LABEL_START - 4}
          y2={BOTTOM}
          strokeWidth={0.75}
          className="stroke-zinc-700"
        />

        {/* weekly average reference line */}
        {weeklyAvgMid !== null && (
          <line
            x1={LEFT_PADDING}
            y1={toY(weeklyAvgMid)}
            x2={RIGHT_LABEL_START - 4}
            y2={toY(weeklyAvgMid)}
            strokeWidth={1}
            strokeDasharray="3 3"
            className="stroke-zinc-400"
          />
        )}

        {/* box plot bars */}
        {days.map((day, i) => {
          const cx = BARS_LEFT + i * SLOT_STEP + SLOT_CENTER;
          const boxLeft = cx - BOX_HALF;

          const maxY = toY(day.calMax);
          const minY = toY(day.calMin);
          const midY = toY(day.calMid);
          const boxHeight = minY - maxY;

          return (
            <g key={i}>
              {day.calMax > 0 && (
                <>
                  {/* vertical connector */}
                  <line
                    x1={cx}
                    y1={maxY}
                    x2={cx}
                    y2={minY}
                    strokeWidth={0.75}
                    className="stroke-zinc-400"
                  />
                  {/* calMax limit line */}
                  <line
                    x1={cx - LIMIT_HALF}
                    y1={maxY}
                    x2={cx + LIMIT_HALF}
                    y2={maxY}
                    strokeWidth={1}
                    strokeLinecap="round"
                    className="stroke-zinc-400"
                  />
                  {/* calMin limit line */}
                  <line
                    x1={cx - LIMIT_HALF}
                    y1={minY}
                    x2={cx + LIMIT_HALF}
                    y2={minY}
                    strokeWidth={1}
                    strokeLinecap="round"
                    className="stroke-zinc-400"
                  />
                  {/* midpoint line — the emphasis */}
                  <line
                    x1={boxLeft}
                    y1={midY}
                    x2={boxLeft + BOX_WIDTH}
                    y2={midY}
                    strokeWidth={3}
                    strokeLinecap="round"
                    className="stroke-zinc-600"
                  />
                </>
              )}
              <text
                x={cx}
                y={BOTTOM + 16}
                textAnchor="middle"
                fontSize={9}
                className="fill-zinc-400"
              >
                {day.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="flex gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-px bg-zinc-400 rounded-full" />
          <span className="text-[10px] text-zinc-400">min / max</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-zinc-600 rounded-full" />
          <span className="text-[10px] text-zinc-400">estimate</span>
        </div>
        {weeklyAvgMid !== null && (
          <div className="flex items-center gap-1.5">
            <svg width="12" height="8">
              <line
                x1="0" y1="4" x2="12" y2="4"
                strokeDasharray="2 2"
                strokeWidth="1"
                className="stroke-zinc-400"
              />
            </svg>
            <span className="text-[10px] text-zinc-400">weekly avg</span>
          </div>
        )}
      </div>
    </div>
  );
}
