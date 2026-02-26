import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRevenueData } from '@/hooks/useRevenueData';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { TrendingUp, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const RevenueChart = () => {
  const [timePeriod, setTimePeriod] = useState('30d');
  const { data: revenueData, isLoading } = useRevenueData(timePeriod);
  const { settings } = useCompanySettings();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Overview
          </CardTitle>
          <CardDescription>Loading revenue data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    recurringRevenue: {
      label: t('recurring-revenue'),
      color: '#2563eb',
    },
    onetimeRevenue: {
      label: t('onetime-revenue'), 
      color: '#16a34a',
    },
  };

  const totalRevenue = revenueData?.reduce((acc, item) => acc + item.recurringRevenue + item.onetimeRevenue, 0) || 0;
      const currency = settings?.currency || 'HKD';
      const currencySymbol = currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : 'HK$';

      const formattedTotal = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    minimumFractionDigits: 0,
  }).format(totalRevenue);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('revenue-overview')}
            </CardTitle>
            <CardDescription>
              {t('revenue-tracking')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{t('last-7-days')}</SelectItem>
                <SelectItem value="30d">{t('last-30-days')}</SelectItem>
                <SelectItem value="90d">{t('last-3-months')}</SelectItem>
                <SelectItem value="1y">{t('last-year')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-right">
              <div className="text-2xl font-bold">{formattedTotal}</div>
              <p className="text-sm text-muted-foreground">{t('total-revenue')}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span className="text-sm text-muted-foreground">{t('recurring-revenue')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-sm text-muted-foreground">{t('onetime-revenue')}</span>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart 
              data={revenueData} 
              margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f1f5f9" 
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  if (timePeriod === '7d') {
                    return date.toLocaleDateString('en-US', { weekday: 'short' });
                  } else if (timePeriod === '30d') {
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  } else if (timePeriod === '90d') {
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  } else {
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }
                }}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(value) => {
                  if (value === 0) return '$0';
                  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
                  return `$${value}`;
                }}
                domain={[0, 'dataMax']}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    className="bg-white border border-border shadow-sm rounded-md p-2"
                    formatter={(value, name) => [
                      new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 0,
                      }).format(value as number),
                      name === 'recurringRevenue' ? t('recurring-revenue') : t('onetime-revenue')
                    ]}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      });
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="recurringRevenue"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 3,
                  stroke: '#2563eb',
                  strokeWidth: 2,
                  fill: 'white'
                }}
              />
              <Line
                type="monotone"
                dataKey="onetimeRevenue"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 3,
                  stroke: '#16a34a',
                  strokeWidth: 2,
                  fill: 'white'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};