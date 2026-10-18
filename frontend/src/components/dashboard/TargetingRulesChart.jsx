import { useContext } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ThemeContext from "../../context/ThemeContext";
import { getChartPalette, getTooltipStyle, resolveRuleTypeColor } from "./chartTheme";

function TargetingRulesChart({ data }) {
  const { theme } = useContext(ThemeContext);
  const palette = getChartPalette(theme);
  const tooltip = getTooltipStyle(theme);
  return (
    <article className="dashboard-chart-card">
      <div className="chart-card-heading"><div><p className="dashboard-eyebrow">Release configuration</p><h3>Targeting Rules</h3><p className="dashboard-chart-subtitle">Rules configured by targeting strategy.</p></div></div>
      {data.length === 0 ? <p className="chart-empty">No targeting rules are configured yet.</p> : (
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }}>
            <CartesianGrid stroke={palette.grid} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: palette.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="type" width={78} tick={{ fill: palette.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: palette.cursor }} contentStyle={tooltip} />
            <Bar dataKey="rules" fill={palette.primary} radius={[0, 5, 5, 0]} name="Rules">
              {data.map((entry) => <Cell key={entry.type} fill={resolveRuleTypeColor(entry.type, palette)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </article>
  );
}

export default TargetingRulesChart;
