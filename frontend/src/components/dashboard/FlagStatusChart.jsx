import { useContext } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ThemeContext from "../../context/ThemeContext";
import { getChartPalette, getTooltipStyle, resolveStatusColor } from "./chartTheme";

function FlagStatusChart({ data }) {
  const { theme } = useContext(ThemeContext);
  const palette = getChartPalette(theme);
  const tooltip = getTooltipStyle(theme);
  return (
    <article className="dashboard-chart-card">
      <div className="chart-card-heading"><div><p className="dashboard-eyebrow">Status distribution</p><h3>Flag Status</h3></div></div>
      {data.length === 0 ? <p className="chart-empty">No feature flags are available yet.</p> : (
        <div className="chart-body chart-body-pie">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={4}>
                {data.map((entry, index) => <Cell key={entry.name} fill={resolveStatusColor(entry.name, index, palette)} />)}
              </Pie>
              <Tooltip contentStyle={tooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">{data.map((entry, index) => <span key={entry.name}><i style={{ background: resolveStatusColor(entry.name, index, palette) }} />{entry.name}<strong>{entry.value}</strong></span>)}</div>
        </div>
      )}
    </article>
  );
}

export default FlagStatusChart;
