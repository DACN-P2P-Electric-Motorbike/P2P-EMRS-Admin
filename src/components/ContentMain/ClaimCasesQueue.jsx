import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import adminService from "../../Service/adminService";

const statusLabel = {
  OPEN: "Case mở",
  UNDER_REVIEW: "Đang review",
  PENDING_SECOND_REVIEW: "Chờ duyệt lần 2",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã bác bỏ",
  RESOLVED: "Đã xử lý",
  CANCELLED: "Đã hủy",
};

const statusClass = {
  OPEN: "bg-yellow-500/10 text-yellow-300",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-300",
  PENDING_SECOND_REVIEW: "bg-purple-500/10 text-purple-300",
  APPROVED: "bg-green-500/10 text-green-300",
  REJECTED: "bg-red-500/10 text-red-300",
  RESOLVED: "bg-emerald-500/10 text-emerald-300",
  CANCELLED: "bg-gray-500/10 text-gray-300",
};

const outcomeLabel = {
  OWNER_CLAIM_APPROVED: "Duyệt claim owner",
  OWNER_CLAIM_PARTIALLY_APPROVED: "Duyệt một phần",
  OWNER_CLAIM_REJECTED: "Bác claim owner",
  DEPOSIT_RELEASE_APPROVED: "Duyệt hoàn cọc",
  PAYOUT_RELEASE_APPROVED: "Duyệt payout",
  NO_ACTION_REQUIRED: "Không cần xử lý",
};

const statusFilters = [
  { value: "", label: "Tất cả" },
  { value: "OPEN", label: "Mở" },
  { value: "UNDER_REVIEW", label: "Review" },
  { value: "PENDING_SECOND_REVIEW", label: "Chờ lần 2" },
  { value: "APPROVED", label: "Duyệt" },
  { value: "REJECTED", label: "Bác" },
  { value: "RESOLVED", label: "Xử lý xong" },
];

const slaLabel = {
  ON_TRACK: "Đúng hạn",
  AT_RISK: "Sắp trễ",
  OVERDUE: "Quá hạn",
  COMPLETED: "Hoàn tất",
};

const slaClass = {
  ON_TRACK: "bg-blue-500/10 text-blue-200",
  AT_RISK: "bg-yellow-500/10 text-yellow-200",
  OVERDUE: "bg-red-500/10 text-red-200",
  COMPLETED: "bg-green-500/10 text-green-200",
};

const stageLabel = {
  FIRST_REVIEW: "Review lần 1",
  SECOND_REVIEW: "Review lần 2",
  CLOSED: "Đã chốt",
};

const slaFilters = [
  { value: "", label: "Tất cả SLA" },
  { value: "OVERDUE", label: "Quá hạn" },
  { value: "AT_RISK", label: "Sắp trễ" },
  { value: "ON_TRACK", label: "Đúng hạn" },
  { value: "COMPLETED", label: "Hoàn tất" },
];

const stageFilters = [
  { value: "", label: "Tất cả giai đoạn" },
  { value: "FIRST_REVIEW", label: "Review lần 1" },
  { value: "SECOND_REVIEW", label: "Review lần 2" },
  { value: "CLOSED", label: "Đã chốt" },
];

const assignmentFilters = [
  { value: "", label: "Tất cả phân công" },
  { value: "MINE", label: "Của tôi" },
  { value: "UNASSIGNED", label: "Chưa giao" },
];

const reviewDecisions = [
  "OWNER_CLAIM_APPROVED",
  "OWNER_CLAIM_PARTIALLY_APPROVED",
  "OWNER_CLAIM_REJECTED",
  "DEPOSIT_RELEASE_APPROVED",
  "PAYOUT_RELEASE_APPROVED",
  "NO_ACTION_REQUIRED",
];

const finalStatuses = ["APPROVED", "REJECTED", "RESOLVED", "CANCELLED"];

const formatId = (id) => (id ? `#${id.slice(0, 8)}` : "-");
const isActiveCase = (item) => !finalStatuses.includes(item.status);

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

const formatMinutes = (value) => {
  const minutes = Math.max(Number(value) || 0, 0);
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours <= 0) return `${remainder} phút`;
  if (remainder === 0) return `${hours} giờ`;
  return `${hours} giờ ${remainder} phút`;
};

const formatHours = (value) => {
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours <= 0) return "-";
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} giờ`;
};

const StatusPill = ({ value }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
      statusClass[value] || "bg-white/10 text-white"
    }`}
  >
    {statusLabel[value] || value}
  </span>
);

const SlaPill = ({ sla }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
      slaClass[sla?.status] || "bg-white/10 text-white"
    }`}
  >
    {slaLabel[sla?.status] || "Chưa có SLA"}
  </span>
);

const ReviewerLine = ({ label, reviewer, decision, reviewedAt }) => (
  <div className="text-xs text-gray-300">
    <p className="font-semibold text-white">{label}</p>
    {decision ? (
      <>
        <p className="mt-1 text-pumpkin">
          {outcomeLabel[decision] || decision}
        </p>
        <p className="mt-1 text-gray-500">
          {reviewer?.fullName || "-"} · {formatDateTime(reviewedAt)}
        </p>
      </>
    ) : (
      <p className="mt-1 text-gray-500">Chưa có quyết định</p>
    )}
  </div>
);

const ClaimCasesQueue = () => {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [slaStatus, setSlaStatus] = useState("");
  const [slaStage, setSlaStage] = useState("");
  const [assignment, setAssignment] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { limit: 100 };
      if (status) params.status = status;
      if (slaStatus) params.slaStatus = slaStatus;
      if (slaStage) params.slaStage = slaStage;
      if (assignment) params.assignment = assignment;
      const [result, summaryResult] = await Promise.all([
        adminService.getClaimCases(params),
        adminService.getClaimCaseSummary(),
      ]);
      setItems(result.data || []);
      setSummary(summaryResult.data || null);
      setSelectedIds([]);
    } catch (err) {
      setError(err.message || "Không thể tải hàng chờ claim");
    } finally {
      setLoading(false);
    }
  }, [assignment, slaStage, slaStatus, status]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const totals = useMemo(() => {
    const pendingSecond = items.filter(
      (item) => item.status === "PENDING_SECOND_REVIEW",
    ).length;
    const firstReview = items.filter(
      (item) => item.sla?.stage === "FIRST_REVIEW",
    ).length;
    const secondReview = items.filter(
      (item) => item.sla?.stage === "SECOND_REVIEW",
    ).length;
    const active = items.filter(isActiveCase).length;
    const overdue = items.filter(
      (item) => item.sla?.status === "OVERDUE",
    ).length;
    const atRisk = items.filter(
      (item) => item.sla?.status === "AT_RISK",
    ).length;
    const unassigned = items.filter(
      (item) => isActiveCase(item) && !item.assignedAdminId,
    ).length;

    return {
      total: items.length,
      active,
      pendingSecond,
      firstReview,
      secondReview,
      overdue,
      atRisk,
      unassigned,
    };
  }, [items]);

  const activeItems = useMemo(() => items.filter(isActiveCase), [items]);
  const selectedItems = useMemo(
    () =>
      items.filter(
        (item) => isActiveCase(item) && selectedIds.includes(item.id),
      ),
    [items, selectedIds],
  );
  const allActiveSelected =
    activeItems.length > 0 &&
    activeItems.every((item) => selectedIds.includes(item.id));
  const dashboard = summary || {
    total: totals.total,
    active: totals.active,
    assignedToMe: 0,
    unassigned: totals.unassigned,
    firstReview: totals.firstReview,
    secondReview: totals.secondReview,
    overdue: totals.overdue,
    atRisk: totals.atRisk,
  };
  const slaPolicy = dashboard.policy;

  const toggleSelectAll = () => {
    setSelectedIds(allActiveSelected ? [] : activeItems.map((item) => item.id));
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  };

  const reviewCase = async (claimCase, decision) => {
    const notes = window.prompt(
      `${outcomeLabel[decision] || decision} - ghi chú review`,
      "",
    );
    if (notes === null) return;

    setBusyId(claimCase.id);
    try {
      await adminService.reviewClaimCase(claimCase.id, { decision, notes });
      await loadQueue();
    } catch (err) {
      alert(err.message || "Không thể duyệt hồ sơ claim");
    } finally {
      setBusyId(null);
    }
  };

  const updateAssignment = async (claimCase, action) => {
    setBusyId(`${action}-${claimCase.id}`);
    try {
      await adminService.updateClaimCaseAssignment(claimCase.id, { action });
      await loadQueue();
    } catch (err) {
      alert(err.message || "Không thể cập nhật phân công hồ sơ claim");
    } finally {
      setBusyId(null);
    }
  };

  const updateSelectedAssignments = async (action) => {
    if (!selectedItems.length) return;

    setBusyId(`BULK-${action}`);
    try {
      await Promise.all(
        selectedItems.map((item) =>
          adminService.updateClaimCaseAssignment(item.id, { action }),
        ),
      );
      await loadQueue();
    } catch (err) {
      alert(err.message || "Không thể cập nhật các hồ sơ claim đã chọn");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-white">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pumpkin/20 border-t-pumpkin"></div>
        <p>Đang tải hàng chờ claim...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">
            Hồ sơ claim
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Theo dõi case bền vững và quyết định four-eyes của Admin.
          </p>
        </div>
        <button
          onClick={loadQueue}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
        >
          Làm mới
        </button>
      </div>

      {slaPolicy && (
        <div className="mb-5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-300">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Chính sách SLA
          </p>
          <p className="mt-1">
            Lần 1: {formatHours(slaPolicy.firstReviewHours)} · Lần 2:{" "}
            {formatHours(slaPolicy.secondReviewHours)} · Cảnh báo còn{" "}
            {formatHours(slaPolicy.atRiskWindowHours)} · Escalation cao sau{" "}
            {formatHours(slaPolicy.highEscalationOverdueHours)} trễ
          </p>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Trạng thái
          </span>
          {statusFilters.map((filter) => (
            <button
              key={filter.value || "all"}
              onClick={() => setStatus(filter.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold ${
                status === filter.value
                  ? "border-pumpkin bg-pumpkin text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
            SLA
          </span>
          {slaFilters.map((filter) => (
            <button
              key={filter.value || "all-sla"}
              onClick={() => setSlaStatus(filter.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold ${
                slaStatus === filter.value
                  ? "border-pumpkin bg-pumpkin text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Giai đoạn
          </span>
          {stageFilters.map((filter) => (
            <button
              key={filter.value || "all-stage"}
              onClick={() => setSlaStage(filter.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold ${
                slaStage === filter.value
                  ? "border-pumpkin bg-pumpkin text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Phân công
          </span>
          {assignmentFilters.map((filter) => (
            <button
              key={filter.value || "all-assignment"}
              onClick={() => setAssignment(filter.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-bold ${
                assignment === filter.value
                  ? "border-pumpkin bg-pumpkin text-white"
                  : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Tổng case
          </p>
          <p className="mt-2 text-2xl font-bold">{dashboard.total}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Đang mở
          </p>
          <p className="mt-2 text-2xl font-bold">{dashboard.active}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Của tôi
          </p>
          <p className="mt-2 text-2xl font-bold">{dashboard.assignedToMe}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Review lần 1
          </p>
          <p className="mt-2 text-2xl font-bold">{dashboard.firstReview}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Review lần 2
          </p>
          <p className="mt-2 text-2xl font-bold">{dashboard.secondReview}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Quá hạn
          </p>
          <p className="mt-2 text-2xl font-bold text-red-200">
            {dashboard.overdue}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Sắp trễ
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-200">
            {dashboard.atRisk}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Chưa giao
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-200">
            {dashboard.unassigned}
          </p>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-sm font-semibold text-gray-200">
            Đã chọn {selectedItems.length} case đang mở
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busyId === "BULK-ASSIGN_SELF"}
              onClick={() => updateSelectedAssignments("ASSIGN_SELF")}
              className="rounded-md border border-pumpkin/30 bg-pumpkin/10 px-3 py-1.5 text-xs font-bold text-pumpkin hover:bg-pumpkin/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Nhận xử lý đã chọn
            </button>
            <button
              disabled={busyId === "BULK-RELEASE"}
              onClick={() => updateSelectedAssignments("RELEASE")}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Bỏ nhận đã chọn
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="rounded-md border border-white/10 bg-transparent px-3 py-1.5 text-xs font-bold text-gray-400 hover:bg-white/5"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-white/5 bg-primary shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1520px] text-left">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-gray-400">
                <th className="p-5">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả case đang mở"
                    checked={allActiveSelected}
                    onChange={toggleSelectAll}
                    disabled={!activeItems.length}
                    className="h-4 w-4 accent-pumpkin"
                  />
                </th>
                <th className="p-5">Case / Booking</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5">Phụ trách</th>
                <th className="p-5">SLA</th>
                <th className="p-5">Người liên quan</th>
                <th className="p-5">Review</th>
                <th className="p-5">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="align-top border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="p-5">
                      <input
                        type="checkbox"
                        aria-label={`Chọn ${item.caseNumber}`}
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelectOne(item.id)}
                        disabled={!isActiveCase(item)}
                        className="h-4 w-4 accent-pumpkin disabled:opacity-40"
                      />
                    </td>
                    <td className="p-5">
                      <p className="font-semibold">{item.caseNumber}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Booking {formatId(item.bookingId)}
                      </p>
                      <p className="mt-3 text-sm text-gray-300">
                        {item.summary || "Chưa có snapshot tóm tắt"}
                      </p>
                      <p className="mt-3 text-xs text-gray-500">
                        Mở lúc {formatDateTime(item.createdAt)}
                      </p>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-2">
                        <StatusPill value={item.status} />
                        {item.outcome && (
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-gray-200">
                            {outcomeLabel[item.outcome] || item.outcome}
                          </span>
                        )}
                      </div>
                      {item.status === "PENDING_SECOND_REVIEW" && (
                        <p className="mt-3 text-xs text-purple-200">
                          Cần Admin khác xác nhận cùng quyết định.
                        </p>
                      )}
                    </td>
                    <td className="p-5 text-xs text-gray-300">
                      {item.assignee ? (
                        <>
                          <p className="font-semibold text-white">
                            {item.assignee.fullName}
                          </p>
                          <p className="mt-1 text-gray-500">
                            {item.assignee.email || "-"}
                          </p>
                          <p className="mt-3 text-gray-500">
                            Nhận lúc {formatDateTime(item.assignedAt)}
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold text-yellow-200">
                          Chưa phân công
                        </p>
                      )}
                      {!finalStatuses.includes(item.status) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            disabled={busyId === `ASSIGN_SELF-${item.id}`}
                            onClick={() =>
                              updateAssignment(item, "ASSIGN_SELF")
                            }
                            className="rounded-md border border-pumpkin/30 bg-pumpkin/10 px-3 py-1.5 text-xs font-bold text-pumpkin hover:bg-pumpkin/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Nhận xử lý
                          </button>
                          {item.assignedAdminId && (
                            <button
                              disabled={busyId === `RELEASE-${item.id}`}
                              onClick={() => updateAssignment(item, "RELEASE")}
                              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Bỏ nhận
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-5 text-xs text-gray-300">
                      <SlaPill sla={item.sla} />
                      <p className="mt-3 text-gray-500">
                        {stageLabel[item.sla?.stage] ||
                          item.sla?.stage ||
                          "Chưa có giai đoạn"}
                      </p>
                      {item.sla?.dueAt && (
                        <p className="mt-1 text-gray-500">
                          Hạn {formatDateTime(item.sla.dueAt)}
                        </p>
                      )}
                      {item.sla?.status === "OVERDUE" && (
                        <p className="mt-1 text-red-200">
                          Trễ {formatMinutes(item.sla.overdueMinutes)}
                        </p>
                      )}
                      {Number(item.sla?.escalationLevel) > 0 && (
                        <p className="mt-1 font-semibold text-pumpkin">
                          Escalation cấp {item.sla.escalationLevel}
                        </p>
                      )}
                      {["ON_TRACK", "AT_RISK"].includes(item.sla?.status) && (
                        <p className="mt-1 text-gray-400">
                          Còn {formatMinutes(item.sla.remainingMinutes)}
                        </p>
                      )}
                    </td>
                    <td className="p-5 text-xs text-gray-300">
                      <p className="font-semibold text-white">
                        Renter: {item.booking?.renter?.fullName || "-"}
                      </p>
                      <p className="mt-1 text-gray-500">
                        {item.booking?.renter?.email || "-"}
                      </p>
                      <p className="mt-3 font-semibold text-white">
                        Owner: {item.booking?.owner?.fullName || "-"}
                      </p>
                      <p className="mt-1 text-gray-500">
                        {item.booking?.owner?.email || "-"}
                      </p>
                      <p className="mt-3 text-pumpkin">
                        {item.booking?.vehicle?.brand}{" "}
                        {item.booking?.vehicle?.model} ·{" "}
                        {item.booking?.vehicle?.licensePlate || "-"}
                      </p>
                    </td>
                    <td className="space-y-4 p-5">
                      <ReviewerLine
                        label="Lần 1"
                        reviewer={item.firstReviewer}
                        decision={item.firstDecision}
                        reviewedAt={item.firstReviewedAt}
                      />
                      <ReviewerLine
                        label="Lần 2"
                        reviewer={item.secondReviewer}
                        decision={item.secondDecision}
                        reviewedAt={item.secondReviewedAt}
                      />
                    </td>
                    <td className="p-5">
                      {finalStatuses.includes(item.status) ? (
                        <p className="text-xs text-gray-500">
                          Case đã có kết luận.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {reviewDecisions.map((decision) => (
                            <button
                              key={decision}
                              disabled={busyId === item.id}
                              onClick={() => reviewCase(item, decision)}
                              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {outcomeLabel[decision]}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="p-10 text-center text-gray-500 italic"
                  >
                    Không có hồ sơ claim phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

StatusPill.propTypes = {
  value: PropTypes.string.isRequired,
};

SlaPill.propTypes = {
  sla: PropTypes.shape({
    status: PropTypes.string,
  }),
};

ReviewerLine.propTypes = {
  label: PropTypes.string.isRequired,
  reviewer: PropTypes.shape({
    fullName: PropTypes.string,
  }),
  decision: PropTypes.string,
  reviewedAt: PropTypes.string,
};

export default ClaimCasesQueue;
