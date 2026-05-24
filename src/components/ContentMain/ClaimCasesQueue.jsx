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

const slaFilters = [
  { value: "", label: "Tất cả SLA" },
  { value: "OVERDUE", label: "Quá hạn" },
  { value: "AT_RISK", label: "Sắp trễ" },
  { value: "ON_TRACK", label: "Đúng hạn" },
  { value: "COMPLETED", label: "Hoàn tất" },
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
      const result = await adminService.getClaimCases(params);
      setItems(result.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải hàng chờ claim");
    } finally {
      setLoading(false);
    }
  }, [slaStatus, status]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const totals = useMemo(() => {
    const pendingSecond = items.filter(
      (item) => item.status === "PENDING_SECOND_REVIEW",
    ).length;
    const active = items.filter(
      (item) => !finalStatuses.includes(item.status),
    ).length;
    const overdue = items.filter(
      (item) => item.sla?.status === "OVERDUE",
    ).length;
    const atRisk = items.filter(
      (item) => item.sla?.status === "AT_RISK",
    ).length;

    return {
      total: items.length,
      active,
      pendingSecond,
      overdue,
      atRisk,
    };
  }, [items]);

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
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Tổng case
          </p>
          <p className="mt-2 text-2xl font-bold">{totals.total}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Đang mở
          </p>
          <p className="mt-2 text-2xl font-bold">{totals.active}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Chờ lần 2
          </p>
          <p className="mt-2 text-2xl font-bold">{totals.pendingSecond}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Quá hạn
          </p>
          <p className="mt-2 text-2xl font-bold text-red-200">
            {totals.overdue}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-primary p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400">
            Sắp trễ
          </p>
          <p className="mt-2 text-2xl font-bold text-yellow-200">
            {totals.atRisk}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-white/5 bg-primary shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1340px] text-left">
            <thead>
              <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-gray-400">
                <th className="p-5">Case / Booking</th>
                <th className="p-5">Trạng thái</th>
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
                      <SlaPill sla={item.sla} />
                      {item.sla?.dueAt && (
                        <p className="mt-3 text-gray-500">
                          Hạn {formatDateTime(item.sla.dueAt)}
                        </p>
                      )}
                      {item.sla?.status === "OVERDUE" && (
                        <p className="mt-1 text-red-200">
                          Trễ {formatMinutes(item.sla.overdueMinutes)}
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
                    colSpan="6"
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
