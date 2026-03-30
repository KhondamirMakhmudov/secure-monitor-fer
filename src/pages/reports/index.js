import { KEYS } from "@/constants/key";
import { URLS } from "@/constants/url";
import useGetQuery from "@/hooks/all/useGetQuery";
import { requestEventTracker } from "@/services/api";
import { useSession } from "next-auth/react";
import { useState } from "react";
import dayjs from "dayjs";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  CyberStyles,
  Corner,
  StatusBadge,
  EventBadge,
  CustomTable,
} from "@/components/reports";
import TitleOfThePage from "@/components/title";
import CyberButton from "@/components/button";
import ExcelButton from "@/components/button/excel-button";
import Link from "next/link";
import * as XLSX from "xlsx-js-style";

// ─── Main page ────────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 20, 50];

const getDateRanges = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - today.getDay());

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const formatDateTime = (date) => date.toISOString().slice(0, 16);

  return {
    today: {
      start_date: formatDateTime(today),
      end_date: formatDateTime(tomorrow),
    },
    yesterday: {
      start_date: formatDateTime(yesterday),
      end_date: formatDateTime(today),
    },
    week: {
      start_date: formatDateTime(weekStart),
      end_date: formatDateTime(tomorrow),
    },
    month: {
      start_date: formatDateTime(monthStart),
      end_date: formatDateTime(tomorrow),
    },
  };
};

const Index = () => {
  const { data: session } = useSession();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all | granted | denied
  const [filterType, setFilterType] = useState("all"); // all | entry | exit
  const [start_date, setStartDate] = useState("");
  const [end_date, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { data: reports, isLoading } = useGetQuery({
    key: [KEYS.reports, page, pageSize, start_date, end_date],
    url: URLS.reports,
    apiClient: requestEventTracker,
    headers: { Authorization: `Bearer ${session?.accessToken}` },
    params: {
      page,
      pageSize,
      ...(start_date && { start_date }),
      ...(end_date && { end_date }),
    },
    enabled: !!session?.accessToken,
  });

  const rows = reports?.data?.data ?? reports?.results ?? reports ?? [];
  const totalCount =
    reports?.data?.pagination?.total ?? reports?.count ?? rows.length;
  const totalPages =
    reports?.data?.pagination?.totalPages ??
    Math.ceil(totalCount / pageSize) ??
    1;

  // Client-side filter on top of paginated data
  const filtered = rows.filter((r) => {
    const name = (r.cardName || "").toLowerCase();
    const dept = "".toLowerCase();
    const cp = (r.checkPointName || "").toLowerCase();
    const matchSearch =
      !search ||
      name.includes(search.toLowerCase()) ||
      dept.includes(search.toLowerCase()) ||
      cp.includes(search.toLowerCase());
    const isSuccess = r.errorCode === "Успешно";
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "granted" && isSuccess) ||
      (filterStatus === "denied" && !isSuccess);
    const matchType =
      filterType === "all" ||
      (filterType === "entry" && r.eventType === "Вход") ||
      (filterType === "exit" && r.eventType === "Выход");
    return matchSearch && matchStatus && matchType;
  });

  // Pagination range
  const pageRange = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    )
      range.push(i);
    if (page - delta > 2) range.unshift("...");
    if (page + delta < totalPages - 1) range.push("...");
    if (totalPages > 1) {
      range.unshift(1);
      range.push(totalPages);
    } else range.unshift(1);
    return [...new Set(range)];
  };

  // Export to Excel
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      // Helper function to apply the same filters
      const applyFilters = (data) => {
        return data.filter((r) => {
          const name = (r.cardName || "").toLowerCase();
          const dept = "".toLowerCase();
          const cp = (r.checkPointName || "").toLowerCase();
          const matchSearch =
            !search ||
            name.includes(search.toLowerCase()) ||
            dept.includes(search.toLowerCase()) ||
            cp.includes(search.toLowerCase());
          const isSuccess = r.errorCode === "Успешно";
          const matchStatus =
            filterStatus === "all" ||
            (filterStatus === "granted" && isSuccess) ||
            (filterStatus === "denied" && !isSuccess);
          const matchType =
            filterType === "all" ||
            (filterType === "entry" && r.eventType === "Вход") ||
            (filterType === "exit" && r.eventType === "Выход");
          return matchSearch && matchStatus && matchType;
        });
      };

      // Fetch all data
      const allData = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await requestEventTracker.get(URLS.reports, {
          headers: { Authorization: `Bearer ${session?.accessToken}` },
          params: {
            page: currentPage,
            pageSize: 100, // Max allowed by API
            ...(start_date && { start_date }),
            ...(end_date && { end_date }),
          },
        });

        const pageData = response?.data?.data ?? response?.results ?? [];
        allData.push(...pageData);

        const totalPages =
          response?.data?.pagination?.totalPages ??
          Math.ceil(
            (response?.data?.pagination?.total ?? response?.count ?? 0) / 100,
          ) ??
          1;

        if (currentPage >= totalPages) {
          hasMore = false;
        }
        currentPage++;
      }

      // Apply filters to all data
      const filteredAllData = applyFilters(allData);

      // Create Excel file
      const wb = XLSX.utils.book_new();
      const wsData = [
        ["#", "Сотрудник", "КПП", "Тип", "Статус", "Дата", "Время"],
        ...filteredAllData.map((row, idx) => {
          const isSuccess = row.errorCode === "Успешно";
          const date = row.realUtc
            ? dayjs(row.realUtc).format("DD.MM.YYYY")
            : "–";
          const time = row.realUtc
            ? new Date(row.realUtc).toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: "Asia/Tashkent",
              })
            : "–";
          return [
            idx + 1,
            row.cardName || "–",
            row.checkPointName || "–",
            row.eventType || "–",
            isSuccess ? "Разрешён" : "Запрещён",
            date,
            time,
          ];
        }),
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [
        { wch: 5 },
        { wch: 20 },
        { wch: 15 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Reports");
      XLSX.writeFile(
        wb,
        `reports_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.xlsx`,
      );
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <CyberStyles />
      <div className="my-6 sm:my-10 lg:my-14 space-y-6">
        {/* ── Page header ── */}
        <div className="flex justify-between items-start gap-4">
          <TitleOfThePage
            title="Отчёты"
            definition={`Журнал проходов сотрудников · ${totalCount} записей`}
          />

          <div className="flex items-center gap-2">
            <ExcelButton onClick={handleExcelExport} disabled={isExporting} />
            <Link href="/reports/late-attendance">
              <CyberButton>Список опаздавших</CyberButton>
            </Link>
          </div>
        </div>

        {/* ── Filters bar ── */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/[0.07] p-4 [box-shadow:0_4px_24px_rgba(0,0,0,0.4)]">
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <SearchIcon
                sx={{ fontSize: 16, color: "#475569" }}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Поиск по имени, отделу, КПП..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] font-mono-cyber text-xs text-slate-300 placeholder-slate-600 tracking-wide outline-none focus:border-sky-500/50 focus:bg-sky-500/[0.04] transition-all duration-150"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1">
              <FilterListIcon sx={{ fontSize: 14, color: "#475569" }} />
              {[
                { val: "all", label: "Все" },
                { val: "granted", label: "Разрешён" },
                { val: "denied", label: "Запрещён" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => {
                    setFilterStatus(val);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-mono-cyber text-[10px] tracking-widest uppercase border transition-all duration-150 ${
                    filterStatus === val
                      ? val === "granted"
                        ? "bg-green-400/10 border-green-400/40 text-green-400"
                        : val === "denied"
                          ? "bg-red-500/10 border-red-500/40 text-red-400"
                          : "bg-sky-500/10 border-sky-500/40 text-sky-400"
                      : "bg-transparent border-white/[0.06] text-slate-600 hover:border-white/[0.12] hover:text-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1">
              {[
                { val: "all", label: "Вход/Выход" },
                { val: "entry", label: "Вход" },
                { val: "exit", label: "Выход" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => {
                    setFilterType(val);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-mono-cyber text-[10px] tracking-widest uppercase border transition-all duration-150 ${
                    filterType === val
                      ? "bg-violet-500/10 border-violet-500/40 text-violet-400"
                      : "bg-transparent border-white/[0.06] text-slate-600 hover:border-white/[0.12] hover:text-slate-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <span className="font-mono-cyber text-[10px] text-slate-600 tracking-widest uppercase">
                Период
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Сегодня", key: "today" },
                  { label: "Вчера", key: "yesterday" },
                  { label: "Неделя", key: "week" },
                  { label: "Месяц", key: "month" },
                ].map(({ label, key }) => (
                  <button
                    key={key}
                    onClick={() => {
                      const ranges = getDateRanges();
                      setStartDate(ranges[key].start_date);
                      setEndDate(ranges[key].end_date);
                      setPage(1);
                    }}
                    className="px-2 py-1 rounded-lg font-mono-cyber text-[9px] tracking-widest uppercase border transition-all duration-150 bg-transparent border-white/[0.06] text-slate-600 hover:border-sky-500/30 hover:text-sky-400 hover:bg-sky-500/[0.06]"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <input
                  type="datetime-local"
                  value={start_date}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] font-mono-cyber text-xs text-slate-400 outline-none focus:border-sky-500/40 transition-all duration-150 cursor-pointer"
                />
                <span className="font-mono-cyber text-[10px] text-slate-600">
                  —
                </span>
                <input
                  type="datetime-local"
                  value={end_date}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] font-mono-cyber text-xs text-slate-400 outline-none focus:border-sky-500/40 transition-all duration-150 cursor-pointer"
                />
              </div>
            </div>

            {/* Page size */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="font-mono-cyber text-[10px] text-slate-600 tracking-widest uppercase">
                Строк
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] font-mono-cyber text-xs text-slate-400 outline-none focus:border-sky-500/40 transition-all duration-150 cursor-pointer"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n} className="bg-slate-900">
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Table card ── */}
        <CustomTable
          columns={["#", "Сотрудник", "КПП", "Тип", "Статус", "Дата", "Время"]}
          data={filtered}
          isLoading={isLoading}
          pageSize={pageSize}
          title="ЖУРНАЛ ДОСТУПА"
          count={totalCount}
          dataCount={filtered.length}
          renderRow={(row, idx) => {
            const isSuccess = row.errorCode === "Успешно";
            const date = row.realUtc
              ? dayjs(row.realUtc).format("DD.MM.YYYY")
              : "–";
            const time = row.realUtc
              ? new Date(row.realUtc).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  timeZone: "Asia/Tashkent",
                })
              : "–";
            return (
              <>
                {/* # */}
                <td className="px-4 py-3">
                  <span className="font-mono-cyber text-[11px] text-slate-600">
                    {(page - 1) * pageSize + idx + 1}
                  </span>
                </td>

                {/* Name */}
                <td className="px-4 py-3">
                  <p className="font-display text-sm font-semibold text-slate-200 leading-tight">
                    {row.cardName || "–"}
                  </p>
                  <p className="font-mono-cyber text-[10px] text-slate-600 mt-0.5"></p>
                </td>

                {/* Checkpoint */}
                <td className="px-4 py-3">
                  <span className="font-mono-cyber text-[11px] text-slate-400">
                    {row.checkPointName || "–"}
                  </span>
                </td>

                {/* Event type */}
                <td className="px-4 py-3">
                  <EventBadge type={row.eventType} />
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <StatusBadge success={isSuccess} />
                </td>

                {/* Date */}
                <td className="px-4 py-3">
                  <span className="font-mono-cyber text-[11px] text-slate-400">
                    {date}
                  </span>
                </td>

                {/* Time */}
                <td className="px-4 py-3">
                  <span className="font-mono-cyber text-[11px] text-slate-300">
                    {time}
                  </span>
                </td>
              </>
            );
          }}
        />

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            {/* Previous button */}
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg font-mono-cyber text-[10px] tracking-widest uppercase border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-white/[0.06] text-slate-600 hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/[0.06] disabled:hover:border-white/[0.06] disabled:hover:text-slate-600 disabled:hover:bg-transparent"
            >
              ← Назад
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {pageRange().map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof p === "number" && setPage(p)}
                  disabled={p === "..." || p === page}
                  className={`px-3 py-2 rounded-lg font-mono-cyber text-[10px] tracking-widest uppercase border transition-all duration-150 ${
                    p === page
                      ? "bg-sky-500/20 border-sky-500/40 text-sky-400 cursor-default"
                      : p === "..."
                        ? "bg-transparent border-transparent text-slate-600 cursor-default"
                        : "bg-transparent border-white/[0.06] text-slate-600 hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/[0.06]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg font-mono-cyber text-[10px] tracking-widest uppercase border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-white/[0.06] text-slate-600 hover:border-sky-500/40 hover:text-sky-400 hover:bg-sky-500/[0.06] disabled:hover:border-white/[0.06] disabled:hover:text-slate-600 disabled:hover:bg-transparent"
            >
              Далее →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Index;

export async function getStaticProps() {
  return {
    props: {
      bgColor: "bg-gray-100",
      headerBg: "bg-white",
    },
  };
}
