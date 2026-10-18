import { useContext } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ThemeContext from "../../context/ThemeContext";
import { getChartPalette, getTooltipStyle, resolveEnvironmentColor } from "./chartTheme";

function FlagsByEnvironmentChart({ data }) {
  const { theme } = useContext(ThemeContext);
  const palette = getChartPalette(theme);
  const tooltip = getTooltipStyle(theme);
  return (
    <article className="dashboard-chart-card">
      <div className="chart-card-heading"><div><p className="dashboard-eyebrow">Environment coverage</p><h3>Flags by Environment</h3></div></div>
      {data.length === 0 ? <p className="chart-empty">No environment assignments are available yet.</p> : (
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={data} margin={{ top: 20, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid stroke={palette.grid} vertical={false} />
            <XAxis dataKey="environment" tick={{ fill: palette.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: palette.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: palette.cursor }} contentStyle={tooltip} />
            <Bar dataKey="flags" fill={palette.primary} radius={[5, 5, 0, 0]} name="Flags">
              {data.map((entry) => <Cell key={entry.environment} fill={resolveEnvironmentColor(entry.environment, palette)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </article>
  );
}

export default FlagsByEnvironmentChart;
