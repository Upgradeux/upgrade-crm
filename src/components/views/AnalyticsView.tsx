'use client';

import React from 'react';
import { useCRM } from '@/lib/store';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  IconCurrencyDollar,
  IconTrophy,
  IconPercentage,
  IconFlame,
  IconChartBar,
  IconMapPin,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconMail,
  IconUsers,
} from '@tabler/icons-react';
import { formatCurrency, getInitials } from '@/lib/utils';
import { ServiceType, LeadSource } from '@/types/crm';

export function AnalyticsView() {
  const { leads, projects, teamMembers, currency } = useCRM();

  // Metrics calculations
  const totalPipelineValue = leads.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);
  const wonLeads = leads.filter((l) => l.status === 'Won');
  const wonRevenue = wonLeads.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);
  const lostLeads = leads.filter((l) => l.status === 'Lost');
  const closedTotal = wonLeads.length + lostLeads.length;
  const winRate = closedTotal > 0 ? Math.round((wonLeads.length / closedTotal) * 100) : 0;
  const avgDealSize = leads.length > 0 ? Math.round(totalPipelineValue / leads.length) : 0;

  // 1. Service Breakdown Data for Bar Chart
  const serviceTypes: ServiceType[] = [
    'AI Voice Agent',
    'Web Development',
    'Workflow / n8n Automation',
    'AI Chatbot',
    'Monthly Retainer',
  ];

  const serviceChartData = serviceTypes.map((st) => {
    const matching = leads.filter((l) => l.serviceInterest === st);
    const value = matching.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);
    return {
      name: st === 'Workflow / n8n Automation' ? 'Workflow Auto' : st,
      value: value,
      count: matching.length,
    };
  });

  // 2. Source Breakdown Data for Donut Chart
  const sourceTypes: LeadSource[] = ['Google Maps', 'Instagram', 'LinkedIn', 'Cold Email', 'Website Inbound'];
  const SOURCE_COLORS: Record<string, string> = {
    'Google Maps': '#22c55e',
    'Instagram': '#ec4899',
    'LinkedIn': '#0ea5e9',
    'Cold Email': '#a855f7',
    'Website Inbound': '#f59e0b',
  };

  const sourceChartData = sourceTypes.map((src) => {
    const matching = leads.filter((l) => l.source === src);
    return {
      name: src,
      value: matching.length,
      revenue: matching.reduce((acc, curr) => acc + (curr.dealValue || 0), 0),
    };
  }).filter((d) => d.value > 0);

  // 3. Funnel Stages Data for Area Chart
  const funnelData = [
    {
      stage: 'Prospects',
      count: leads.length,
      label: 'Sourced Leads',
    },
    {
      stage: 'Contacted',
      count: leads.filter((l) => l.status !== 'Not Contacted').length,
      label: 'Initial Outreach',
    },
    {
      stage: 'Meeting',
      count: leads.filter((l) => l.status === 'Booked Call' || l.status === 'In Processing / Proposal' || l.status === 'Won').length,
      label: 'Demo Scheduled',
    },
    {
      stage: 'Proposal',
      count: leads.filter((l) => l.status === 'In Processing / Proposal' || l.status === 'Won').length,
      label: 'Proposal Active',
    },
    {
      stage: 'Won',
      count: wonLeads.length,
      label: 'Closed Deals',
    },
  ];

  // Custom Tooltip Formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="p-2 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-medium)] shadow-md text-[11px] space-y-0.5">
          <div className="font-medium text-[var(--t-font-color-primary)]">
            {label || data.name}
          </div>
          <div className="font-mono text-[var(--t-font-color-secondary)]">
            {typeof data.value === 'number' && data.value > 1000
              ? formatCurrency(data.value, currency)
              : `${data.value} leads`}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 h-[calc(100vh-48px)] p-3 overflow-y-auto bg-[var(--t-background-primary)] flex flex-col gap-3 select-none">
      {/* Top 4 KPI Metrics (Twenty High-Density Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* KPI 1: Pipeline Value */}
        <div className="p-3 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
              Total Pipeline
            </span>
            <IconCurrencyDollar size={14} className="text-[var(--t-font-color-tertiary)]" />
          </div>
          <div className="font-mono text-[18px] text-[var(--t-font-color-primary)]">
            {formatCurrency(totalPipelineValue, currency)}
          </div>
          <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
            {leads.length} active opportunities
          </span>
        </div>

        {/* KPI 2: Won Revenue */}
        <div className="p-3 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
              Won Revenue
            </span>
            <IconTrophy size={14} className="text-emerald-500" />
          </div>
          <div className="font-mono text-[18px] text-emerald-500">
            {formatCurrency(wonRevenue, currency)}
          </div>
          <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
            {wonLeads.length} deals closed
          </span>
        </div>

        {/* KPI 3: Win Rate */}
        <div className="p-3 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
              Win Rate
            </span>
            <IconPercentage size={14} className="text-[var(--t-font-color-tertiary)]" />
          </div>
          <div className="font-mono text-[18px] text-[var(--t-font-color-primary)]">
            {winRate}%
          </div>
          <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
            Proposal closing ratio
          </span>
        </div>

        {/* KPI 4: Avg Contract Size */}
        <div className="p-3 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col justify-between gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-semibold text-[var(--t-font-color-tertiary)] uppercase tracking-wider">
              Avg Deal Budget
            </span>
            <IconFlame size={14} className="text-[var(--t-font-color-tertiary)]" />
          </div>
          <div className="font-mono text-[18px] text-[var(--t-font-color-primary)]">
            {formatCurrency(avgDealSize, currency)}
          </div>
          <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
            Per qualified client
          </span>
        </div>
      </div>

      {/* Grid of 4 Recharts Interactive Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Chart 1: Revenue by Service Type */}
        <div className="p-3.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium text-[var(--t-font-color-primary)]">
              Pipeline Value by Service
            </div>
            <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
              Value ($)
            </span>
          </div>

          <div className="h-[200px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--t-border-color-light)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--t-font-color-tertiary)' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  axisLine={{ stroke: 'var(--t-border-color-light)' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) => `$${val / 1000}k`}
                  tick={{ fontSize: 10, fill: 'var(--t-font-color-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--t-background-transparent-light)' }} />
                <Bar dataKey="value" fill="var(--t-font-color-primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lead Acquisition Sources (Donut) */}
        <div className="p-3.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium text-[var(--t-font-color-primary)]">
              Lead Acquisition Channels
            </div>
            <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
              Share (%)
            </span>
          </div>

          <div className="h-[200px] w-full flex items-center justify-between">
            <div className="h-full w-[60%]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={sourceChartData}
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourceChartData.map((entry) => (
                      <Cell key={entry.name} fill={SOURCE_COLORS[entry.name] || '#888888'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Compact Legend */}
            <div className="w-[40%] space-y-1.5 text-[11px] pr-2">
              {sourceChartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-[6px] h-[6px] rounded-full shrink-0"
                      style={{ backgroundColor: SOURCE_COLORS[item.name] }}
                    />
                    <span className="text-[var(--t-font-color-secondary)] truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono text-[var(--t-font-color-primary)] shrink-0 ml-1">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Outreach & Conversion Funnel */}
        <div className="p-3.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium text-[var(--t-font-color-primary)]">
              Outreach Conversion Funnel
            </div>
            <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
              Stage Progression
            </span>
          </div>

          <div className="h-[180px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={funnelData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--t-font-color-primary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--t-font-color-primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="var(--t-border-color-light)" vertical={false} />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: 'var(--t-font-color-tertiary)' }}
                  axisLine={{ stroke: 'var(--t-border-color-light)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--t-font-color-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--t-font-color-primary)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Team Outreach Leaderboard */}
        <div className="p-3.5 rounded-[6px] bg-[var(--t-background-secondary)] border border-[var(--t-border-color-light)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-medium text-[var(--t-font-color-primary)]">
              Team Outreach & Closing
            </div>
            <span className="text-[10.5px] text-[var(--t-font-color-tertiary)] font-mono">
              Active Reps
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {teamMembers.map((member) => {
              const assigned = leads.filter((l) => l.leadOwner === member.name);
              const won = assigned.filter((l) => l.status === 'Won');
              const value = assigned.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);

              return (
                <div
                  key={member.id}
                  className="p-2 rounded-[4px] bg-[var(--t-background-primary)] border border-[var(--t-border-color-light)] flex items-center justify-between text-[11.5px]"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-[24px] h-[24px] rounded-full bg-gradient-to-tr ${member.avatarColor} text-white flex items-center justify-center font-medium text-[10px] shrink-0`}
                    >
                      {getInitials(member.name)}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--t-font-color-primary)] leading-tight">
                        {member.name}
                      </div>
                      <div className="text-[10px] text-[var(--t-font-color-tertiary)]">
                        {member.role.split('/')[0]}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-[var(--t-font-color-tertiary)]">
                      {assigned.length} leads
                    </span>
                    <span className="text-emerald-500 font-medium">
                      {won.length} won
                    </span>
                    <span className="text-[var(--t-font-color-primary)]">
                      {formatCurrency(value, currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
