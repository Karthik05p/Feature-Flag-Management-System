import { useContext } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ThemeContext from "../../context/ThemeContext";
import { getChartPalette, getTooltipStyle, resolveFlagTypeColor } from "./chartTheme";

function FlagTypesChart({ data }) {
  const { theme } = useContext(ThemeContext);
  const palette = getChartPalette(theme);
  const tooltip = getTooltipStyle(theme);
  return (
    <article className="dashboard-chart-card">
      <div className="chart-card-heading"><div><p className="dashboard-eyebrow">Configuration mix</p><h3>Flag Types</h3></div></div>
      {data.length === 0 ? <p className="chart-empty">No flag types are available yet.</p> : (
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 4 }}>
            <CartesianGrid stroke={palette.grid} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: palette.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="type" width={68} tick={{ fill: palette.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: palette.cursor }} contentStyle={tooltip} />
            <Bar dataKey="flags" fill={palette.secondary} radius={[0, 5, 5, 0]} name="Flags">
              {data.map((entry) => <Cell key={entry.type} fill={resolveFlagTypeColor(entry.type, palette)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </article>
  );
}

export default FlagTypesChart;
