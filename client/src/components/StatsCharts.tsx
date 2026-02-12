import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, Legend
} from "recharts";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ShieldCheck, Swords, Flame, TrendingUp, Coins, Target, Zap, Trophy } from "lucide-react";

interface Task {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  completed: boolean;
}

interface StatsChartsProps {
  tasks: Task[];
  totalXp: number;
  currentLevel: number;
}

const DIFF_COLORS = { easy: "#22c55e", medium: "#3b82f6", hard: "#ef4444" };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-primary/50 p-3 rounded-lg shadow-[0_0_15px_rgba(0,217,255,0.3)] backdrop-blur-md">
        <p className="text-primary font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-mono">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function StatsCharts({ tasks, totalXp, currentLevel }: StatsChartsProps) {
  // ── Core Calculations ──
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedCount = completedTasks.length;
  const totalCount = tasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Difficulty breakdown
  const easyCompleted = completedTasks.filter(t => t.difficulty === "easy").length;
  const mediumCompleted = completedTasks.filter(t => t.difficulty === "medium").length;
  const hardCompleted = completedTasks.filter(t => t.difficulty === "hard").length;
  const easyTotal = tasks.filter(t => t.difficulty === "easy").length;
  const mediumTotal = tasks.filter(t => t.difficulty === "medium").length;
  const hardTotal = tasks.filter(t => t.difficulty === "hard").length;

  // Gold calculation (earned from completed tasks)
  const goldEarned = (easyCompleted * 50) + (mediumCompleted * 100) + (hardCompleted * 200);
  const goldBalance = Number(localStorage.getItem("shop_gold") || "0");

  // XP per difficulty
  const xpFromEasy = completedTasks.filter(t => t.difficulty === "easy").reduce((s, t) => s + t.xpReward, 0);
  const xpFromMedium = completedTasks.filter(t => t.difficulty === "medium").reduce((s, t) => s + t.xpReward, 0);
  const xpFromHard = completedTasks.filter(t => t.difficulty === "hard").reduce((s, t) => s + t.xpReward, 0);

  // ── Chart Data ──

  // 1. Completion Donut
  const completionData = [
    { name: "Concluídas", value: completedCount, color: "#22c55e" },
    { name: "Pendentes", value: Math.max(pendingTasks.length, 0), color: "#374151" },
  ];

  // 2. Difficulty Breakdown (Bar Chart)
  const difficultyData = [
    {
      name: "Fácil",
      Completas: easyCompleted,
      Pendentes: easyTotal - easyCompleted,
    },
    {
      name: "Médio",
      Completas: mediumCompleted,
      Pendentes: mediumTotal - mediumCompleted,
    },
    {
      name: "Difícil",
      Completas: hardCompleted,
      Pendentes: hardTotal - hardCompleted,
    },
  ];

  // 3. Attributes Radar (all calculated from real data)
  const maxDiffCount = Math.max(easyCompleted, mediumCompleted, hardCompleted, 1);
  const attributesData = [
    { subject: "Agilidade", A: Math.min((easyCompleted / maxDiffCount) * 100, 100) },
    { subject: "Força", A: Math.min((mediumCompleted / maxDiffCount) * 100, 100) },
    { subject: "Sabedoria", A: Math.min((hardCompleted / maxDiffCount) * 100, 100) },
    { subject: "Disciplina", A: Math.min(completionRate, 100) },
    { subject: "Resistência", A: Math.min(currentLevel * 8, 100) },
  ];

  // 4. XP Distribution (Pie by difficulty)
  const xpDistribution = [
    { name: "Fácil", value: xpFromEasy, color: DIFF_COLORS.easy },
    { name: "Médio", value: xpFromMedium, color: DIFF_COLORS.medium },
    { name: "Difícil", value: xpFromHard, color: DIFF_COLORS.hard },
  ].filter(d => d.value > 0);

  // ── Difficulty icon helper ──
  const DiffIcon = ({ diff }: { diff: "easy" | "medium" | "hard" }) => {
    const icons = { easy: ShieldCheck, medium: Swords, hard: Flame };
    const colors = { easy: "text-green-500", medium: "text-blue-500", hard: "text-red-500" };
    const Icon = icons[diff];
    return <Icon className={`w-4 h-4 ${colors[diff]}`} />;
  };

  return (
    <div className="space-y-6">

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Missões", val: totalCount, icon: Target, color: "text-blue-400", bg: "border-blue-500/20" },
          { label: "Concluídas", val: completedCount, icon: Trophy, color: "text-green-400", bg: "border-green-500/20" },
          { label: "Taxa Sucesso", val: `${completionRate}%`, icon: TrendingUp, color: "text-cyan-400", bg: "border-cyan-500/20" },
          { label: "XP Total", val: totalXp, icon: Zap, color: "text-yellow-400", bg: "border-yellow-500/20" },
          { label: "Nível", val: currentLevel, icon: Trophy, color: "text-purple-400", bg: "border-purple-500/20" },
          { label: "Ouro Ganho", val: goldEarned, icon: Coins, color: "text-amber-400", bg: "border-amber-500/20" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-card/40 border ${stat.bg} p-3 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center text-center gap-1`}
          >
            <stat.icon className={`w-4 h-4 ${stat.color} mb-0.5`} />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight">{stat.label}</span>
            <span className={`text-xl font-display font-bold ${stat.color}`}>{stat.val}</span>
          </motion.div>
        ))}
      </div>

      {/* ── DIFFICULTY BREAKDOWN CARDS ── */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { diff: "easy" as const, label: "Fácil", done: easyCompleted, total: easyTotal, gold: easyCompleted * 50 },
          { diff: "medium" as const, label: "Médio", done: mediumCompleted, total: mediumTotal, gold: mediumCompleted * 100 },
          { diff: "hard" as const, label: "Difícil", done: hardCompleted, total: hardTotal, gold: hardCompleted * 200 },
        ]).map((d, i) => (
          <motion.div
            key={d.diff}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className={`bg-card/30 border rounded-xl p-3 text-center`}
            style={{ borderColor: DIFF_COLORS[d.diff] + "40" }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <DiffIcon diff={d.diff} />
              <span className="text-xs font-bold" style={{ color: DIFF_COLORS[d.diff] }}>{d.label}</span>
            </div>
            <span className="text-2xl font-display font-bold text-foreground">{d.done}</span>
            <span className="text-xs text-muted-foreground"> / {d.total}</span>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${d.total > 0 ? (d.done / d.total) * 100 : 0}%`,
                  backgroundColor: DIFF_COLORS[d.diff],
                }}
              />
            </div>
            <p className="text-[10px] text-amber-400 mt-1.5">🪙 {d.gold} ouro</p>
          </motion.div>
        ))}
      </div>

      {/* ── CHARTS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Radar: Atributos do Herói */}
        <Card className="bg-black/40 border-primary/30 p-4 holographic-container min-h-[320px] flex flex-col">
          <h3 className="font-display text-primary text-center mb-2 text-sm font-bold uppercase tracking-widest">Atributos do Herói</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={270}>
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={attributesData}>
                <PolarGrid stroke="rgba(0, 217, 255, 0.15)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Atributos"
                  dataKey="A"
                  stroke="#00d9ff"
                  strokeWidth={2}
                  fill="#00d9ff"
                  fillOpacity={0.25}
                  dot={{ r: 3, fill: "#00d9ff" }}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar: Missões por Dificuldade */}
        <Card className="bg-black/40 border-primary/30 p-4 holographic-container min-h-[320px] flex flex-col">
          <h3 className="font-display text-primary text-center mb-2 text-sm font-bold uppercase tracking-widest">Missões por Dificuldade</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={difficultyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Completas" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pendentes" stackId="a" fill="#374151" radius={[4, 4, 0, 0]} />
                <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut: Taxa de Sucesso */}
        <Card className="bg-black/40 border-primary/30 p-4 holographic-container min-h-[320px] flex flex-col">
          <h3 className="font-display text-primary text-center mb-2 text-sm font-bold uppercase tracking-widest">Taxa de Sucesso</h3>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  animationDuration={800}
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: "40px" }}>
              <div className="text-center">
                <span className="text-3xl font-bold text-white block">{completionRate}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Conclusão</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Pie: XP por Dificuldade (only show if there's data) */}
        {xpDistribution.length > 0 && (
          <Card className="bg-black/40 border-primary/30 p-4 holographic-container min-h-[320px] flex flex-col md:col-span-2 lg:col-span-1">
            <h3 className="font-display text-primary text-center mb-2 text-sm font-bold uppercase tracking-widest">XP por Dificuldade</h3>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie
                    data={xpDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    animationDuration={800}
                  >
                    {xpDistribution.map((entry, index) => (
                      <Cell key={`xp-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: "40px" }}>
                <div className="text-center">
                  <span className="text-2xl font-bold text-yellow-400 block">{totalXp}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">XP Total</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Economy Summary */}
        <Card className="bg-black/40 border-amber-500/30 p-5 holographic-container min-h-[320px] flex flex-col justify-center md:col-span-2 lg:col-span-2">
          <h3 className="font-display text-amber-400 text-center mb-4 text-sm font-bold uppercase tracking-widest">💰 Economia</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Ouro Ganho</p>
              <p className="text-2xl font-display font-bold text-amber-400">{goldEarned}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {easyCompleted > 0 && <span className="text-green-400">{easyCompleted}×50</span>}
                {mediumCompleted > 0 && <span className="text-blue-400"> + {mediumCompleted}×100</span>}
                {hardCompleted > 0 && <span className="text-red-400"> + {hardCompleted}×200</span>}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Ouro Atual</p>
              <p className="text-2xl font-display font-bold text-yellow-500">🪙 {goldBalance}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Na carteira</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Ouro Gasto</p>
              <p className="text-2xl font-display font-bold text-red-400">{Math.max(goldEarned - goldBalance, 0)}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Na loja</p>
            </div>
          </div>

          {/* Per-task average */}
          <div className="mt-6 pt-4 border-t border-amber-500/10 grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">XP Médio / Missão</p>
              <p className="text-lg font-display font-bold text-cyan-400">
                {completedCount > 0 ? Math.round(totalXp / completedCount) : 0} XP
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Ouro Médio / Missão</p>
              <p className="text-lg font-display font-bold text-amber-400">
                {completedCount > 0 ? Math.round(goldEarned / completedCount) : 0} 🪙
              </p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
