import TitleOfThePage from "@/components/title";
import { KEYS } from "@/constants/key";
import { URLS } from "@/constants/url";
import useGetQuery from "@/hooks/all/useGetQuery";
import { requestPython } from "@/services/api";
import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { CustomTable } from "@/components/reports";
import { config } from "@/config";

const Index = () => {
  const { data: session } = useSession();

  const [openLevel1Id, setOpenLevel1Id] = useState(null);
  const [openLevel2Id, setOpenLevel2Id] = useState(null);
  const [openLevel3Id, setOpenLevel3Id] = useState(null);
  const [openLevel4Id, setOpenLevel4Id] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [tardinessDataList, setTardinessDataList] = useState([]);
  const [tardinessLoading, setTardinessLoading] = useState(false);
  const [selectedUnitCode, setSelectedUnitCode] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const lastSentEmployeeIdsRef = useRef(null);

  // ─── LEVEL QUERIES ────────────────────────────────────────────────────────

  const { data: level1List, isLoading: level1Loading } = useGetQuery({
    key: KEYS.orgUnit,
    url: URLS.orgUnit,
    apiClient: requestPython,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.accessToken}`,
    },
    params: { is_root: true, limit: 150 },
    enabled: !!session?.accessToken,
  });

  const { data: level2List, isLoading: level2Loading } = useGetQuery({
    key: [KEYS.orgUnit, openLevel1Id],
    url: URLS.orgUnit,
    apiClient: requestPython,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.accessToken}`,
    },
    params: { parent_id: openLevel1Id, limit: 150 },
    enabled: !!openLevel1Id && !!session?.accessToken,
  });

  const { data: level3List, isLoading: level3Loading } = useGetQuery({
    key: [KEYS.orgUnit, openLevel2Id],
    url: URLS.orgUnit,
    apiClient: requestPython,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.accessToken}`,
    },
    params: { parent_id: openLevel2Id, limit: 150 },
    enabled: !!openLevel2Id && !!session?.accessToken,
  });

  const { data: level4List, isLoading: level4Loading } = useGetQuery({
    key: [KEYS.orgUnit, openLevel3Id],
    url: URLS.orgUnit,
    apiClient: requestPython,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.accessToken}`,
    },
    params: { parent_id: openLevel3Id, limit: 150 },
    enabled: !!openLevel3Id && !!session?.accessToken,
  });

  const { data: level5List, isLoading: level5Loading } = useGetQuery({
    key: [KEYS.orgUnit, openLevel4Id],
    url: URLS.orgUnit,
    apiClient: requestPython,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.accessToken}`,
    },
    params: { parent_id: openLevel4Id, limit: 150 },
    enabled: !!openLevel4Id && !!session?.accessToken,
  });

  // employees by unit_code

  const { data: employeesByUnitCode } = useGetQuery({
    key: [KEYS.employeesByUnitCode, selectedUnitId],
    url: `${URLS.employeesByUnitCode}/${selectedUnitCode}`,
    apiClient: requestPython,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.accessToken}`,
    },
    enabled: !!selectedUnitCode && !!session?.accessToken,
  });

  // ─── SELECTED UNIT DETAIL ─────────────────────────────────────────────────

  const { data: selectedUnitData } = useGetQuery({
    key: [KEYS.orgUnit, "detail", selectedUnitId],
    url: URLS.orgUnit,
    apiClient: requestPython,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.accessToken}`,
    },
    params: { id: selectedUnitId },
    enabled: !!selectedUnitId && !!session?.accessToken,
  });

  // ─── DERIVE FLAT DATA ─────────────────────────────────────────────────────

  const level1Data = level1List?.data ?? level1List ?? [];
  const level2Data = level2List?.data ?? level2List ?? [];
  const level3Data = level3List?.data ?? level3List ?? [];
  const level4Data = level4List?.data ?? level4List ?? [];
  const level5Data = level5List?.data ?? level5List ?? [];

  const findUnitInTree = useCallback(
    (unitId) => {
      for (const levelData of [
        level1Data,
        level2Data,
        level3Data,
        level4Data,
        level5Data,
      ]) {
        if (Array.isArray(levelData)) {
          const found = levelData.find((item) => item.id === unitId);
          if (found) return found;
        }
      }
      return null;
    },
    [level1Data, level2Data, level3Data, level4Data, level5Data],
  );

  let unitDetailData = selectedUnitData?.data ?? selectedUnitData;
  if (!unitDetailData?.workplace) {
    unitDetailData = findUnitInTree(selectedUnitId);
  }

  const workplaceData = unitDetailData?.workplace ?? [];

  // ─── FETCH TARDINESS + EMPLOYEE DETAILS ───────────────────────────────────

  useEffect(() => {
    if (!employeesByUnitCode || employeesByUnitCode.length === 0) return;
    if (!session?.accessToken) return;

    const employeeIds = Array.isArray(employeesByUnitCode)
      ? employeesByUnitCode
      : (employeesByUnitCode?.data ?? []);

    if (employeeIds.length === 0) return;

    const serialized = JSON.stringify(employeeIds) + startDate;

    if (lastSentEmployeeIdsRef.current === serialized) return;
    lastSentEmployeeIdsRef.current = serialized;

    const run = async () => {
      setTardinessLoading(true);
      setTardinessDataList([]);

      try {
        // Step 1: POST to get filterSessionId
        const postRes = await fetch(
          `${config.EVENT_TRACKER_URL}${URLS.sessionOfTheEmployee}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.accessToken}`,
            },
            body: JSON.stringify({ employeeIds }),
          },
        );

        if (!postRes.ok) {
          console.error("filter-sessions POST failed:", postRes.status);
          return;
        }

        const postData = await postRes.json();
        const filterSessionId =
          postData?.filterSessionId ?? postData?.data?.filterSessionId ?? null;

        if (!filterSessionId) {
          console.warn("No filterSessionId in response:", postData);
          return;
        }

        // Step 2: GET tardiness
        const getRes = await fetch(
          `${config.EVENT_TRACKER_URL}${URLS.tardiness}?date=${startDate}&filter_session_id=${filterSessionId}`,
          {
            headers: { Authorization: `Bearer ${session.accessToken}` },
          },
        );

        if (!getRes.ok) {
          console.error("tardiness GET failed:", getRes.status);
          return;
        }

        const getData = await getRes.json();
        const items = getData?.data?.items ?? getData?.items ?? [];

        // Step 3: Fetch employee details for each item in parallel
        const itemsWithEmployees = await Promise.all(
          items.map(async (item) => {
            if (!item.employeeId) return { ...item, employee: null };

            try {
              const empRes = await fetch(
                `${config.STAFFIO_URL}${URLS.employeePhoto}${item.employeeId}`,
                {
                  headers: { Authorization: `Bearer ${session?.accessToken}` },
                },
              );

              if (!empRes.ok) return { ...item, employee: null };

              const empData = await empRes.json();
              return {
                ...item,
                employee: empData?.data ?? empData ?? null,
              };
            } catch {
              return { ...item, employee: null };
            }
          }),
        );

        setTardinessDataList(itemsWithEmployees);
      } catch (err) {
        console.error("Tardiness fetch error:", err);
      } finally {
        setTardinessLoading(false);
      }
    };

    run();
  }, [employeesByUnitCode, startDate, session?.accessToken]);

  // ─── UNIT SELECT HANDLER ──────────────────────────────────────────────────

  const handleNodeClick = useCallback((item, level) => {
    lastSentEmployeeIdsRef.current = null;
    setSelectedUnitId(item.id);
    setSelectedUnitCode(item.unit_code);
    setTardinessDataList([]);

    if (level === 1)
      setOpenLevel1Id((prev) => (prev === item.id ? null : item.id));
    else if (level === 2)
      setOpenLevel2Id((prev) => (prev === item.id ? null : item.id));
    else if (level === 3)
      setOpenLevel3Id((prev) => (prev === item.id ? null : item.id));
    else if (level === 4)
      setOpenLevel4Id((prev) => (prev === item.id ? null : item.id));
  }, []);

  // ─── TREE NODE ────────────────────────────────────────────────────────────

  const isLevelOpen = (level, id) => {
    if (level === 1) return openLevel1Id === id;
    if (level === 2) return openLevel2Id === id;
    if (level === 3) return openLevel3Id === id;
    if (level === 4) return openLevel4Id === id;
    return false;
  };

  const TreeNode = ({ item, level, hasChildren }) => {
    const isSelected = selectedUnitId === item.id;
    const isOpen = isLevelOpen(level, item.id);

    return (
      <div style={{ paddingLeft: `${(level - 1) * 16}px`, marginTop: "4px" }}>
        <button
          onClick={() => handleNodeClick(item, level)}
          className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left transition-all ${
            isSelected
              ? "bg-sky-500/20 border border-sky-500/40 text-sky-400"
              : "hover:bg-white/[0.03] text-slate-300"
          }`}
        >
          {hasChildren ? (
            isOpen ? (
              <ExpandMoreIcon
                sx={{ fontSize: 18 }}
                className="flex-shrink-0 mt-0.5"
              />
            ) : (
              <ChevronRightIcon
                sx={{ fontSize: 18 }}
                className="flex-shrink-0 mt-0.5"
              />
            )
          ) : (
            <div className="w-6 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-mono-cyber text-sm break-words whitespace-normal">
              {item.name}
            </p>
            <p className="font-mono-cyber text-xs text-slate-600 break-words whitespace-normal">
              {item.unit_code}
            </p>
          </div>
        </button>
      </div>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="my-6">
        <TitleOfThePage
          title="Список опаздавших"
          definition="Журнал опозданий сотрудников"
        />
      </div>

      {/* Date Filter */}
      <div className="mb-6 grid grid-cols-12 gap-4">
        <div className="col-span-3">
          <label className="block text-sm font-mono-cyber text-slate-400 mb-2">
            Дата отчёта
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              lastSentEmployeeIdsRef.current = null;
              setStartDate(e.target.value);
            }}
            className="w-full px-3 py-2 bg-slate-900 border border-white/[0.1] rounded-lg text-lg text-slate-300 font-mono-cyber focus:outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left sidebar */}
        <div className="col-span-4">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-white/[0.07] p-4 [box-shadow:0_4px_24px_rgba(0,0,0,0.4)] max-h-[600px] overflow-y-auto">
            <h3 className="font-display text-sm font-semibold text-slate-300 mb-3 px-3">
              Структура организации
            </h3>

            {level1Loading ? (
              <p className="text-xs text-slate-600 px-3 py-2">Загрузка...</p>
            ) : Array.isArray(level1Data) && level1Data.length > 0 ? (
              level1Data.map((item1) => (
                <div key={item1.id}>
                  <TreeNode item={item1} level={1} hasChildren />

                  {openLevel1Id === item1.id && (
                    <div>
                      {level2Loading ? (
                        <p className="text-xs text-slate-600 ml-8 py-2">
                          Загрузка...
                        </p>
                      ) : Array.isArray(level2Data) && level2Data.length > 0 ? (
                        level2Data.map((item2) => (
                          <div key={item2.id}>
                            <TreeNode item={item2} level={2} hasChildren />

                            {openLevel2Id === item2.id && (
                              <div>
                                {level3Loading ? (
                                  <p className="text-xs text-slate-600 ml-12 py-2">
                                    Загрузка...
                                  </p>
                                ) : Array.isArray(level3Data) &&
                                  level3Data.length > 0 ? (
                                  level3Data.map((item3) => (
                                    <div key={item3.id}>
                                      <TreeNode
                                        item={item3}
                                        level={3}
                                        hasChildren
                                      />

                                      {openLevel3Id === item3.id && (
                                        <div>
                                          {level4Loading ? (
                                            <p className="text-xs text-slate-600 ml-16 py-2">
                                              Загрузка...
                                            </p>
                                          ) : Array.isArray(level4Data) &&
                                            level4Data.length > 0 ? (
                                            level4Data.map((item4) => (
                                              <div key={item4.id}>
                                                <TreeNode
                                                  item={item4}
                                                  level={4}
                                                  hasChildren
                                                />

                                                {openLevel4Id === item4.id && (
                                                  <div>
                                                    {level5Loading ? (
                                                      <p className="text-xs text-slate-600 ml-20 py-2">
                                                        Загрузка...
                                                      </p>
                                                    ) : Array.isArray(
                                                        level5Data,
                                                      ) &&
                                                      level5Data.length > 0 ? (
                                                      level5Data.map(
                                                        (item5) => (
                                                          <TreeNode
                                                            key={item5.id}
                                                            item={item5}
                                                            level={5}
                                                            hasChildren={false}
                                                          />
                                                        ),
                                                      )
                                                    ) : null}
                                                  </div>
                                                )}
                                              </div>
                                            ))
                                          ) : null}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : null}
                              </div>
                            )}
                          </div>
                        ))
                      ) : null}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-600 px-3 py-2">Нет данных</p>
            )}
          </div>
        </div>

        {/* Right content */}
        <div className="col-span-8">
          {selectedUnitId && (
            <CustomTable
              title={`Опоздания — ${unitDetailData?.name ?? "Подразделение"}`}
              columns={[
                "#",
                "Сотрудник",
                "Время прихода",
                "Опоздание (мин)",
                "Статус",
              ]}
              data={tardinessDataList}
              isLoading={tardinessLoading}
              renderRow={(item, index) => (
                <>
                  <td className="px-4 py-3 text-sm text-slate-400 font-mono-cyber">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    <div className="flex items-center gap-3">
                      {item.employee?.photo && (
                        <img
                          src={item.employee.photo}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <div className="font-mono-cyber">
                          {item.employee?.first_name ??
                            item.employee?.firstName ??
                            "—"}{" "}
                          {item.employee?.last_name ??
                            item.employee?.lastName ??
                            ""}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {item.employee?.tabel_number ??
                            item.employee?.tabelNumber ??
                            item.employeeId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 font-mono-cyber">
                    {item.firstIn ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300 font-mono-cyber">
                    {item.tardinessMinutes > 0
                      ? `${item.tardinessMinutes} мин`
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono-cyber ${
                        item.absent
                          ? "bg-yellow-500/20 text-yellow-400"
                          : item.isLate
                            ? "bg-red-500/20 text-red-400"
                            : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {item.absent
                        ? "Отсутствует"
                        : item.isLate
                          ? "Опоздал"
                          : "Вовремя"}
                    </span>
                  </td>
                </>
              )}
              dataCount={tardinessDataList.length}
              pageSize={20}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
