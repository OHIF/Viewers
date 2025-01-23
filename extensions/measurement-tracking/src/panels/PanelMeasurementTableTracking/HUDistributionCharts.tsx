import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface DataPoint {
  hu: number;
  frequency: number;
}

interface HUDistributionChartProps {
  data: DataPoint[];
  type: 'bone' | 'muscle' | 'fat' | string;
}

const HUDistributionChart: React.FC<HUDistributionChartProps> = ({ data, type }) => {
  const getChartConfig = () => {
    switch (type) {
      case 'bone':
        return {
          title: '骨骼组织 HU 分布',
          color: '#60A5FA',
        };
      case 'muscle':
        return {
          title: '肌肉组织 HU 分布',
          color: '#F87171',
        };
      case 'fat':
        return {
          title: '脂肪组织 HU 分布',
          color: '#FB923C',
        };
      default:
        return {
          title: 'HU 分布',
          color: '#94A3B8',
        };
    }
  };

  // 过滤掉频率为0的数据点，并确保数据按HU值排序
  const filteredData = data.filter(point => point.frequency > 0).sort((a, b) => a.hu - b.hu);

  // 计算Y轴范围和刻度
  const yAxisConfig = useMemo(() => {
    if (!filteredData?.length) {
      return { max: 25, ticks: [0, 5, 10, 15, 20, 25] };
    }

    const maxFrequency = Math.max(...filteredData.map(d => d.frequency));
    const roundedMax = Math.ceil(maxFrequency / 5) * 5; // 向上取整到最近的5的倍数

    // 生成刻度值
    const tickCount = 5;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
      return (roundedMax * i) / tickCount;
    });

    return {
      max: roundedMax,
      ticks,
    };
  }, [filteredData]);

  const config = getChartConfig();

  return (
    <div className="rounded bg-[#0f1729] p-3">
      <div className="mb-2 text-xs text-blue-100">{config.title}</div>
      <ResponsiveContainer
        width="100%"
        height={120}
      >
        <LineChart
          data={filteredData}
          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1e293b"
            vertical={false}
          />
          <XAxis
            dataKey="hu"
            stroke="#334155"
            tick={{ fontSize: 10, fill: '#bfdbfe' }}
            tickSize={3}
          />
          <YAxis
            stroke="#334155"
            tick={{ fontSize: 10, fill: '#bfdbfe' }}
            tickSize={3}
            domain={[0, yAxisConfig.max]}
            ticks={yAxisConfig.ticks}
            allowDecimals={true}
            tickFormatter={value => value.toFixed(1)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '4px',
              color: '#e2e8f0',
              fontSize: '12px',
              padding: '4px 8px',
            }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'frequency']}
          />
          <Line
            type="linear"
            dataKey="frequency"
            stroke={config.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: config.color }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HUDistributionChart;
