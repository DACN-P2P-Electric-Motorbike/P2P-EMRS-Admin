import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import adminService from "../../Service/adminService";

const statusClass = {
  OPEN: "bg-yellow-500/10 text-yellow-300",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-300",
  RESOLVED: "bg-green-500/10 text-green-300",
  REJECTED: "bg-gray-500/10 text-gray-300",
};

const severityClass = {
  LOW: "bg-green-500/10 text-green-300",
  MEDIUM: "bg-blue-500/10 text-blue-300",
  HIGH: "bg-orange-500/10 text-orange-300",
  CRITICAL: "bg-red-500/10 text-red-300",
};

const categoryLabel = {
  ACCIDENT: "Tai nạn",
  DAMAGE: "Hư hại",
  THEFT: "Mất cắp",
  MECHANICAL_ISSUE: "Lỗi kỹ thuật",
  NO_SHOW: "Không xuất hiện",
  VEHICLE_MISMATCH: "Sai xe/tình trạng",
  LATE_RETURN: "Trả trễ",
  OTHER: "Khác",
};

const claimStatusLabel = {
  NO_CLAIM: "Chưa có claim",
  OPEN: "Mới mở",
  UNDER_REVIEW: "Đang xét duyệt",
  AWAITING_CHARGE_REVIEW: "Chờ duyệt phí",
  AWAITING_DEPOSIT_DECISION: "Chờ quyết định cọc",
  AWAITING_PAYOUT: "Chờ payout",
  RESOLVED: "Đã xử lý",
};

const claimStatusClass = {
  NO_CLAIM: "bg-gray-500/10 text-gray-300",
  OPEN: "bg-yellow-500/10 text-yellow-300",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-300",
  AWAITING_CHARGE_REVIEW: "bg-orange-500/10 text-orange-300",
  AWAITING_DEPOSIT_DECISION: "bg-orange-500/10 text-orange-300",
  AWAITING_PAYOUT: "bg-purple-500/10 text-purple-300",
  RESOLVED: "bg-green-500/10 text-green-300",
};

const claimSlaLabel = {
  ON_TRACK: "Đúng hạn",
  AT_RISK: "Sắp trễ",
  OVERDUE: "Quá hạn",
  COMPLETED: "Hoàn tất",
};

const claimSlaClass = {
  ON_TRACK: "bg-blue-500/10 text-blue-200",
  AT_RISK: "bg-yellow-500/10 text-yellow-200",
  OVERDUE: "bg-red-500/10 text-red-200",
  COMPLETED: "bg-green-500/10 text-green-200",
};

const claimRiskLabel = {
  LOW: "Rủi ro thấp",
  MEDIUM: "Rủi ro vừa",
  HIGH: "Rủi ro cao",
};

const claimRiskClass = {
  LOW: "bg-green-500/10 text-green-200",
  MEDIUM: "bg-orange-500/10 text-orange-200",
  HIGH: "bg-red-500/10 text-red-200",
};

const claimCaseStatusLabel = {
  OPEN: "Case mở",
  UNDER_REVIEW: "Đang review",
  PENDING_SECOND_REVIEW: "Chờ duyệt lần 2",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã bác bỏ",
  RESOLVED: "Đã xử lý",
  CANCELLED: "Đã hủy",
};

const claimOutcomeLabel = {
  OWNER_CLAIM_APPROVED: "Duyệt claim owner",
  OWNER_CLAIM_PARTIALLY_APPROVED: "Duyệt một phần",
  OWNER_CLAIM_REJECTED: "Bác claim owner",
  DEPOSIT_RELEASE_APPROVED: "Duyệt hoàn cọc",
  PAYOUT_RELEASE_APPROVED: "Duyệt payout",
  NO_ACTION_REQUIRED: "Không cần xử lý",
};

const protectionPlanLabel = {
  BASIC: "Basic",
  STANDARD: "Standard",
  PREMIUM: "Premium",
};

const formatId = (id) => (id ? `#${id.slice(0, 8)}` : "-");

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

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

const ProtectionSettlementPanel = ({ settlement }) => {
  if (!settlement) return null;

  return (
    <div className="mt-3 rounded-md border border-green-500/20 bg-green-500/5 p-3 text-xs text-gray-300">
      <p className="font-semibold text-green-200">
        Phân bổ gói bảo vệ{" "}
        {protectionPlanLabel[settlement.protectionPlan] ||
          settlement.protectionPlan}
      </p>
      {settlement.status === "AWAITING_APPROVED_DAMAGE_CHARGE" ? (
        <p className="mt-2 text-gray-400">
          Chờ phí hư hại được duyệt để tính khấu trừ và hạn mức.
        </p>
      ) : (
        <div className="mt-2 grid gap-1 sm:grid-cols-2">
          <p>
            Hư hại đủ điều kiện: {money.format(settlement.eligibleDamageAmount)}
          </p>
          <p>Khấu trừ: {money.format(settlement.deductibleAppliedAmount)}</p>
          <p className="text-green-200">
            Nền tảng hỗ trợ: {money.format(settlement.platformCoverageAmount)}
          </p>
          <p className="text-yellow-200">
            Renter chịu: {money.format(settlement.renterLiabilityAmount)}
          </p>
          {settlement.excessAboveCoverageAmount > 0 && (
            <p>
              Vượt hạn mức: {money.format(settlement.excessAboveCoverageAmount)}
            </p>
          )}
          {settlement.nonCoveredChargeAmount > 0 && (
            <p>
              Phí ngoài bảo vệ:{" "}
              {money.format(settlement.nonCoveredChargeAmount)}
            </p>
          )}
        </div>
      )}
      <p className="mt-2 text-gray-500">
        Phân bổ nội bộ; không xác nhận giao dịch cổng thanh toán.
      </p>
    </div>
  );
};

const parseJsonObject = (value) => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value;
};

const claimBlockerText = (blocker) => {
  const count = blocker.count || 0;
  switch (blocker.code) {
    case "UNRESOLVED_INCIDENTS":
      return `${count} sự cố đang mở hoặc đang xét duyệt`;
    case "UNRESOLVED_POST_TRIP_CHARGES":
      return `${count} phí sau chuyến cần duyệt`;
    case "APPROVED_CHARGES_NOT_CAPTURED":
      return `${count} phí đã duyệt chưa khấu trừ hoặc miễn`;
    case "DEPOSIT_DECISION_PENDING":
      return "Tiền cọc đang chờ quyết định";
    case "OWNER_PAYOUT_ON_HOLD":
      return "Payout owner đang bị giữ";
    default:
      return blocker.label || blocker.code;
  }
};

const claimActorLabel = (actor) => {
  switch ((actor || "").toUpperCase()) {
    case "ADMIN":
      return "Admin";
    case "OWNER":
      return "Owner";
    case "RENTER":
      return "Renter";
    default:
      return actor || "-";
  }
};

const claimTimelineText = (event) => {
  switch (event.type) {
    case "BOOKING_CREATED":
      return "Booking được tạo";
    case "PAYMENT_COMPLETED":
      return "Thanh toán hoàn tất";
    case "TRIP_COMPLETED":
      return "Chuyến đi hoàn tất";
    case "DEPOSIT_HELD":
      return "Tiền cọc được giữ";
    case "DEPOSIT_DISPUTED":
      return "Tiền cọc chuyển tranh chấp";
    case "DEPOSIT_RELEASED":
      return "Tiền cọc đã hoàn";
    case "POST_TRIP_CHARGE_CREATED":
      return "Phí sau chuyến được tạo";
    case "POST_TRIP_CHARGE_REVIEWED":
      return "Phí sau chuyến được duyệt";
    case "INCIDENT_CREATED":
      return "Sự cố được báo cáo";
    case "INCIDENT_REVIEWED":
      return "Sự cố được xem xét";
    case "INCIDENT_RESOLVED":
      return "Sự cố được kết luận";
    case "OWNER_PAYOUT_CREATED":
      return "Payout owner được chuẩn bị";
    case "OWNER_PAYOUT_PROCESSED":
      return "Payout owner bắt đầu xử lý";
    case "OWNER_PAYOUT_COMPLETED":
      return "Payout owner hoàn tất";
    case "EVIDENCE_ANNOTATED":
      return "Evidence được ghi chú";
    default:
      return event.label || event.type;
  }
};

const annotationTargetKey = (target) =>
  `${target.targetType}:${target.targetId}`;

const buildAnnotationTargets = (summary) => {
  if (!summary) return [];

  const targets = [];
  const seen = new Set();
  const addTarget = (target) => {
    if (!target.targetId) return;
    const key = annotationTargetKey(target);
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ ...target, key });
  };

  (summary.incidents || []).forEach((incident) => {
    addTarget({
      targetType: "INCIDENT_REPORT",
      targetId: incident.id,
      label: `Sự cố ${categoryLabel[incident.category] || incident.category} ${formatId(incident.id)}`,
    });

    const evidence = parseJsonObject(incident.evidence);
    (evidence.handoverPhotos || []).forEach((photo, index) => {
      addTarget({
        targetType: "HANDOVER_PHOTO",
        targetId: photo.id,
        label: `Ảnh bàn giao ${photo.photoType || index + 1} ${formatId(photo.id)}`,
      });
    });
  });

  (summary.charges || []).forEach((charge) => {
    addTarget({
      targetType: "POST_TRIP_CHARGE",
      targetId: charge.id,
      label: `Phí ${charge.type} ${formatId(charge.id)}`,
    });
  });

  return targets;
};

const parseAnnotationTags = (value) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

const Pill = ({ value, tone = "status" }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
      tone === "severity"
        ? severityClass[value] || "bg-white/10 text-white"
        : statusClass[value] || "bg-white/10 text-white"
    }`}
  >
    {value}
  </span>
);

const ClaimStatusPill = ({ value }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
      claimStatusClass[value] || "bg-white/10 text-white"
    }`}
  >
    {claimStatusLabel[value] || value}
  </span>
);

const ClaimSlaPill = ({ sla }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
      claimSlaClass[sla?.status] || "bg-white/10 text-white"
    }`}
  >
    {claimSlaLabel[sla?.status] || "Chưa có SLA"}
  </span>
);

const ClaimRiskPill = ({ risk }) => (
  <span
    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
      claimRiskClass[risk?.level] || "bg-white/10 text-white"
    }`}
  >
    {claimRiskLabel[risk?.level] || "Chưa chấm rủi ro"}
  </span>
);

const EvidenceLinks = ({ report }) => {
  const evidence = parseJsonObject(report.evidence);
  const required = parseJsonObject(report.requiredEvidence);
  const urls = evidence.evidenceUrls || [];
  const handoverPhotos = evidence.handoverPhotos || [];

  return (
    <div className="space-y-2">
      <p
        className={`text-[11px] font-bold uppercase tracking-widest ${
          required.photoRequired && !required.satisfied
            ? "text-red-300"
            : "text-gray-400"
        }`}
      >
        {required.photoRequired ? "Bắt buộc chứng cứ ảnh" : "Chứng cứ tùy chọn"}
      </p>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, index) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-200 hover:border-pumpkin/70 hover:text-pumpkin"
          >
            File {index + 1}
          </a>
        ))}
        {handoverPhotos.map((photo, index) => (
          <a
            key={photo.id || photo.photoUrl}
            href={photo.photoUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-blue-400/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-100 hover:border-blue-300"
          >
            {photo.photoType || `Bàn giao ${index + 1}`}
          </a>
        ))}
      </div>
      {urls.length === 0 && handoverPhotos.length === 0 && (
        <p className="text-xs text-gray-500">Không có chứng cứ đính kèm</p>
      )}
    </div>
  );
};

const IncidentReportsQueue = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [claimSummary, setClaimSummary] = useState(null);
  const [claimLoadingId, setClaimLoadingId] = useState(null);
  const [claimCaseBusyId, setClaimCaseBusyId] = useState(null);
  const [error, setError] = useState("");
  const [claimError, setClaimError] = useState("");
  const [annotationBusy, setAnnotationBusy] = useState(false);
  const [annotationForm, setAnnotationForm] = useState({
    targetKey: "",
    note: "",
    tags: "",
  });

  const annotationTargets = useMemo(
    () => buildAnnotationTargets(claimSummary),
    [claimSummary],
  );

  const annotationTargetLabels = useMemo(
    () =>
      new Map(
        annotationTargets.map((target) => [
          annotationTargetKey(target),
          target.label,
        ]),
      ),
    [annotationTargets],
  );

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminService.getIncidentQueue(100);
      setItems(result.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải hàng chờ sự cố");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!claimSummary) return;
    setAnnotationForm((current) => {
      const hasCurrentTarget = annotationTargets.some(
        (target) => target.key === current.targetKey,
      );
      return {
        ...current,
        targetKey: hasCurrentTarget
          ? current.targetKey
          : annotationTargets[0]?.key || "",
      };
    });
  }, [annotationTargets, claimSummary]);

  const totals = useMemo(() => {
    const critical = items.filter(
      (item) => item.severity === "CRITICAL",
    ).length;
    const evidenceRequired = items.filter(
      (item) => parseJsonObject(item.requiredEvidence).photoRequired,
    ).length;

    return {
      total: items.length,
      critical,
      evidenceRequired,
    };
  }, [items]);

  const reviewIncident = async (incident, status) => {
    const adminNotes = window.prompt("Ghi chú xử lý", "");
    if (adminNotes === null) return;

    setBusyId(incident.id);
    try {
      await adminService.reviewIncidentReport(incident.id, {
        status,
        adminNotes,
      });
      await loadQueue();
    } catch (err) {
      alert(err.message || "Không thể cập nhật sự cố");
    } finally {
      setBusyId(null);
    }
  };

  const loadClaimSummary = async (bookingId) => {
    setClaimLoadingId(bookingId);
    setClaimError("");
    try {
      const result = await adminService.getBookingClaimSummary(bookingId);
      setClaimSummary(result.data || result);
    } catch (err) {
      setClaimError(err.message || "Không thể tải hồ sơ claim");
    } finally {
      setClaimLoadingId(null);
    }
  };

  const createClaimCase = async (bookingId) => {
    setClaimCaseBusyId(`create-${bookingId}`);
    setClaimError("");
    try {
      await adminService.createOrRefreshClaimCase(bookingId);
      await loadClaimSummary(bookingId);
    } catch (err) {
      setClaimError(err.message || "Không thể tạo hồ sơ claim");
    } finally {
      setClaimCaseBusyId(null);
    }
  };

  const reviewClaimCase = async (claimCase, decision) => {
    const notes = window.prompt(
      `${claimOutcomeLabel[decision] || decision} - ghi chú review`,
      "",
    );
    if (notes === null) return;

    setClaimCaseBusyId(`review-${claimCase.id}`);
    setClaimError("");
    try {
      await adminService.reviewClaimCase(claimCase.id, { decision, notes });
      await loadClaimSummary(claimCase.bookingId);
    } catch (err) {
      setClaimError(err.message || "Không thể duyệt hồ sơ claim");
    } finally {
      setClaimCaseBusyId(null);
    }
  };

  const submitEvidenceAnnotation = async (event) => {
    event.preventDefault();
    if (!claimSummary) return;

    const target = annotationTargets.find(
      (item) => item.key === annotationForm.targetKey,
    );
    const note = annotationForm.note.trim();
    if (!target || !note) {
      alert("Chọn evidence và nhập ghi chú trước khi lưu");
      return;
    }

    setAnnotationBusy(true);
    setClaimError("");
    try {
      await adminService.createEvidenceAnnotation(claimSummary.bookingId, {
        targetType: target.targetType,
        targetId: target.targetId,
        claimCaseId: claimSummary.claimCase?.id,
        note,
        tags: parseAnnotationTags(annotationForm.tags),
      });
      setAnnotationForm((current) => ({
        ...current,
        note: "",
        tags: "",
      }));
      await loadClaimSummary(claimSummary.bookingId);
    } catch (err) {
      setClaimError(err.message || "Không thể lưu ghi chú evidence");
    } finally {
      setAnnotationBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white">
        <div className="w-10 h-10 border-4 border-pumpkin/20 border-t-pumpkin rounded-full animate-spin mb-4"></div>
        <p>Đang tải hàng chờ sự cố...</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-white min-h-screen">
      <div className="flex flex-wrap justify-between gap-4 items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">
            Báo cáo sự cố
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Phân loại sự cố, đối chiếu chứng cứ và giữ cọc khi cần xử lý.
          </p>
        </div>
        <button
          onClick={loadQueue}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Sự cố mở
          </p>
          <p className="text-2xl font-bold mt-2">{totals.total}</p>
        </div>
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Mức nghiêm trọng
          </p>
          <p className="text-2xl font-bold mt-2">{totals.critical}</p>
        </div>
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Cần chứng cứ ảnh
          </p>
          <p className="text-2xl font-bold mt-2">{totals.evidenceRequired}</p>
        </div>
      </div>

      {claimError && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {claimError}
        </div>
      )}

      {claimSummary && (
        <section className="mb-6 rounded-xl border border-pumpkin/20 bg-primary p-5 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">
                Hồ sơ claim {formatId(claimSummary.bookingId)}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ClaimStatusPill value={claimSummary.status} />
                <span className="text-xs text-gray-400">
                  {claimSummary.blockers?.length || 0} blocker ·{" "}
                  {claimSummary.nextActions?.length || 0} bước tiếp theo
                </span>
              </div>
            </div>
            <button
              onClick={() => setClaimSummary(null)}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:bg-white/10"
            >
              Đóng
            </button>
          </div>

          <div className="mt-5 rounded-lg border border-white/5 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-gray-500">
                  Four-eyes claim case
                </p>
                {claimSummary.claimCase ? (
                  <>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-gray-200">
                        {claimSummary.claimCase.caseNumber}
                      </span>
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold text-blue-200">
                        {claimCaseStatusLabel[claimSummary.claimCase.status] ||
                          claimSummary.claimCase.status}
                      </span>
                      <ClaimSlaPill sla={claimSummary.claimCase.sla} />
                      <ClaimRiskPill risk={claimSummary.claimCase.risk} />
                      {claimSummary.claimCase.outcome && (
                        <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-bold text-green-200">
                          {claimOutcomeLabel[claimSummary.claimCase.outcome] ||
                            claimSummary.claimCase.outcome}
                        </span>
                      )}
                    </div>
                    {claimSummary.claimCase.sla?.dueAt && (
                      <p className="mt-2 text-xs text-gray-500">
                        SLA: {formatDateTime(claimSummary.claimCase.sla.dueAt)}
                        {claimSummary.claimCase.sla.status === "OVERDUE"
                          ? ` · trễ ${formatMinutes(claimSummary.claimCase.sla.overdueMinutes)}`
                          : ` · còn ${formatMinutes(claimSummary.claimCase.sla.remainingMinutes)}`}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Phụ trách:{" "}
                      {claimSummary.claimCase.assignee?.fullName ||
                        "Chưa phân công"}
                    </p>
                    {claimSummary.claimCase.risk && (
                      <div className="mt-3 rounded-md border border-white/5 bg-black/10 p-3 text-xs text-gray-400">
                        <p className="font-semibold text-white">
                          Điểm rủi ro {claimSummary.claimCase.risk.score}
                        </p>
                        {claimSummary.claimCase.risk.indicators?.length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {claimSummary.claimCase.risk.indicators.map(
                              (indicator) => (
                                <li key={indicator.code}>{indicator.label}</li>
                              ),
                            )}
                          </ul>
                        ) : (
                          <p className="mt-2">Chưa có cờ rủi ro.</p>
                        )}
                      </div>
                    )}
                    <ProtectionSettlementPanel
                      settlement={claimSummary.claimCase.protectionSettlement}
                    />
                  </>
                ) : (
                  <p className="mt-2 text-sm text-gray-400">
                    Chưa có case bền vững cho booking này.
                  </p>
                )}
                {claimSummary.claimCase?.summary && (
                  <p className="mt-2 text-xs text-gray-400">
                    {claimSummary.claimCase.summary}
                  </p>
                )}
              </div>
              <button
                disabled={
                  claimCaseBusyId === `create-${claimSummary.bookingId}`
                }
                onClick={() => createClaimCase(claimSummary.bookingId)}
                className="rounded-md border border-pumpkin/30 bg-pumpkin/10 px-3 py-1.5 text-xs font-bold text-pumpkin hover:bg-pumpkin hover:text-white disabled:opacity-60"
              >
                {claimSummary.claimCase ? "Cập nhật case" : "Tạo case"}
              </button>
            </div>

            {claimSummary.claimCase && (
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "OWNER_CLAIM_APPROVED",
                  "OWNER_CLAIM_PARTIALLY_APPROVED",
                  "OWNER_CLAIM_REJECTED",
                  "DEPOSIT_RELEASE_APPROVED",
                  "PAYOUT_RELEASE_APPROVED",
                  "NO_ACTION_REQUIRED",
                ].map((decision) => (
                  <button
                    key={decision}
                    disabled={
                      claimCaseBusyId ===
                        `review-${claimSummary.claimCase.id}` ||
                      [
                        "APPROVED",
                        "REJECTED",
                        "RESOLVED",
                        "CANCELLED",
                      ].includes(claimSummary.claimCase.status)
                    }
                    onClick={() =>
                      reviewClaimCase(claimSummary.claimCase, decision)
                    }
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {claimOutcomeLabel[decision]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-500">
                Sự cố chưa xong
              </p>
              <p className="mt-1 text-lg font-bold">
                {claimSummary.totals?.unresolvedIncidentCount || 0}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-500">
                Phí chờ xử lý
              </p>
              <p className="mt-1 text-lg font-bold text-yellow-200">
                {money.format(
                  (claimSummary.totals?.pendingChargeAmount || 0) +
                    (claimSummary.totals?.approvedChargeAmount || 0),
                )}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-500">
                Cọc có thể hoàn
              </p>
              <p className="mt-1 text-lg font-bold text-green-200">
                {money.format(
                  claimSummary.totals?.releasableDepositAmount || 0,
                )}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-3">
              <p className="text-[11px] uppercase tracking-widest text-gray-500">
                Payout owner
              </p>
              <p className="mt-1 text-lg font-bold text-blue-200">
                {money.format(claimSummary.totals?.ownerPayoutAmount || 0)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Blocker
              </p>
              <div className="mt-3 space-y-2">
                {(claimSummary.blockers || []).length > 0 ? (
                  claimSummary.blockers.map((blocker) => (
                    <p
                      key={blocker.code}
                      className="rounded-lg border border-yellow-500/10 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-100"
                    >
                      {claimBlockerText(blocker)}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Không còn blocker.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Bước tiếp theo
              </p>
              <div className="mt-3 space-y-2">
                {(claimSummary.nextActions || []).length > 0 ? (
                  claimSummary.nextActions.map((action) => (
                    <p
                      key={`${action.actor}-${action.action}`}
                      className="rounded-lg border border-blue-500/10 bg-blue-500/5 px-3 py-2 text-xs text-blue-100"
                    >
                      {claimActorLabel(action.actor)}: {action.action}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Không cần thao tác.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Dòng xử lý
              </p>
              <div className="mt-3 space-y-2">
                {(claimSummary.timeline || [])
                  .slice(-4)
                  .reverse()
                  .map((event) => (
                    <p
                      key={`${event.type}-${event.occurredAt}`}
                      className="text-xs text-gray-300"
                    >
                      <span className="text-gray-500">
                        {formatDateTime(event.occurredAt)}
                      </span>{" "}
                      {claimTimelineText(event)}
                    </p>
                  ))}
                {(claimSummary.timeline || []).length === 0 && (
                  <p className="text-xs text-gray-500">Chưa có timeline.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form
              onSubmit={submitEvidenceAnnotation}
              className="rounded-lg border border-white/5 bg-white/[0.03] p-4"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Ghi chú evidence
              </p>
              <label
                htmlFor="evidence-target"
                className="mt-4 block text-[11px] font-bold uppercase tracking-widest text-gray-500"
              >
                Evidence
              </label>
              <select
                id="evidence-target"
                value={annotationForm.targetKey}
                onChange={(event) =>
                  setAnnotationForm((current) => ({
                    ...current,
                    targetKey: event.target.value,
                  }))
                }
                disabled={annotationTargets.length === 0}
                className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
              >
                {annotationTargets.length === 0 ? (
                  <option value="">Không có evidence để ghi chú</option>
                ) : (
                  annotationTargets.map((target) => (
                    <option key={target.key} value={target.key}>
                      {target.label}
                    </option>
                  ))
                )}
              </select>

              <label
                htmlFor="evidence-note"
                className="mt-4 block text-[11px] font-bold uppercase tracking-widest text-gray-500"
              >
                Ghi chú
              </label>
              <textarea
                id="evidence-note"
                value={annotationForm.note}
                onChange={(event) =>
                  setAnnotationForm((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                rows={3}
                maxLength={1000}
                className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                placeholder="Ví dụ: ảnh checkout khớp vị trí xước trên báo cáo owner"
              />

              <label
                htmlFor="evidence-tags"
                className="mt-4 block text-[11px] font-bold uppercase tracking-widest text-gray-500"
              >
                Tag
              </label>
              <input
                id="evidence-tags"
                value={annotationForm.tags}
                onChange={(event) =>
                  setAnnotationForm((current) => ({
                    ...current,
                    tags: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-600"
                placeholder="damage, checkout, rõ ảnh"
              />

              <button
                type="submit"
                disabled={annotationBusy || annotationTargets.length === 0}
                className="mt-4 rounded-md bg-pumpkin px-4 py-2 text-xs font-bold text-white hover:bg-pumpkin/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {annotationBusy ? "Đang lưu" : "Lưu ghi chú"}
              </button>
            </form>

            <div className="rounded-lg border border-white/5 bg-white/[0.03] p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Ghi chú đã lưu
              </p>
              <div className="mt-4 space-y-3">
                {(claimSummary.evidenceAnnotations || []).length > 0 ? (
                  claimSummary.evidenceAnnotations.map((annotation) => (
                    <div
                      key={annotation.id}
                      className="rounded-lg border border-white/5 bg-black/10 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        <span>
                          {annotationTargetLabels.get(
                            `${annotation.targetType}:${annotation.targetId}`,
                          ) ||
                            `${annotation.targetType} ${formatId(annotation.targetId)}`}
                        </span>
                        <span>{formatDateTime(annotation.createdAt)}</span>
                        {annotation.author?.fullName && (
                          <span>{annotation.author.fullName}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-200">
                        {annotation.note}
                      </p>
                      {(annotation.tags || []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {annotation.tags.map((tag) => (
                            <span
                              key={`${annotation.id}-${tag}`}
                              className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">
                    Chưa có ghi chú evidence.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-primary rounded-xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1180px]">
            <thead>
              <tr className="text-gray-400 border-b border-white/5 text-xs uppercase tracking-widest">
                <th className="p-5">Sự cố</th>
                <th className="p-5">Booking / Xe</th>
                <th className="p-5">Người liên quan</th>
                <th className="p-5">Chứng cứ</th>
                <th className="p-5">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-white/5 align-top"
                  >
                    <td className="p-5 max-w-[360px]">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Pill value={item.status} />
                        <Pill value={item.severity} tone="severity" />
                      </div>
                      <p className="font-semibold">
                        {categoryLabel[item.category] || item.category}
                      </p>
                      <p className="mt-2 text-sm text-gray-300">
                        {item.description}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Gửi lúc {formatDateTime(item.createdAt)}
                      </p>
                    </td>
                    <td className="p-5">
                      <div className="flex gap-3">
                        {item.booking?.vehicle?.images?.[0] && (
                          <img
                            src={item.booking.vehicle.images[0]}
                            alt="vehicle"
                            className="h-14 w-20 rounded-lg object-cover border border-white/10"
                          />
                        )}
                        <div>
                          <p className="font-semibold">
                            {formatId(item.bookingId)}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {item.booking?.vehicle?.brand}{" "}
                            {item.booking?.vehicle?.model}
                          </p>
                          <p className="mt-1 text-xs font-mono text-pumpkin">
                            {item.booking?.vehicle?.licensePlate || "-"}
                          </p>
                          {item.postTripCharge && (
                            <p className="mt-2 text-xs text-yellow-200">
                              Phí: {item.postTripCharge.type}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-xs text-gray-300">
                      <p className="font-semibold text-white">
                        Người báo: {item.reporter?.fullName || "-"}
                      </p>
                      <p className="mt-1 text-gray-500">
                        {item.reporter?.email || "-"}
                      </p>
                      <p className="mt-3 font-semibold text-white">
                        Renter: {item.booking?.renter?.fullName || "-"}
                      </p>
                      <p className="mt-1 text-gray-500">
                        Owner: {item.booking?.owner?.fullName || "-"}
                      </p>
                    </td>
                    <td className="p-5 min-w-[260px]">
                      <EvidenceLinks report={item} />
                    </td>
                    <td className="p-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={claimLoadingId === item.bookingId}
                          onClick={() => loadClaimSummary(item.bookingId)}
                          className="px-3 py-1.5 rounded-md bg-pumpkin/20 text-pumpkin hover:bg-pumpkin hover:text-white text-xs font-bold"
                        >
                          {claimLoadingId === item.bookingId
                            ? "Đang tải"
                            : "Xem claim"}
                        </button>
                        {item.status === "OPEN" && (
                          <button
                            disabled={busyId === item.id}
                            onClick={() => reviewIncident(item, "UNDER_REVIEW")}
                            className="px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white text-xs font-bold"
                          >
                            Đang xem
                          </button>
                        )}
                        {(item.status === "OPEN" ||
                          item.status === "UNDER_REVIEW") && (
                          <>
                            <button
                              disabled={busyId === item.id}
                              onClick={() => reviewIncident(item, "RESOLVED")}
                              className="px-3 py-1.5 rounded-md bg-green-500/20 text-green-300 hover:bg-green-500 hover:text-white text-xs font-bold"
                            >
                              Đã xử lý
                            </button>
                            <button
                              disabled={busyId === item.id}
                              onClick={() => reviewIncident(item, "REJECTED")}
                              className="px-3 py-1.5 rounded-md bg-gray-500/20 text-gray-300 hover:bg-gray-500 hover:text-white text-xs font-bold"
                            >
                              Bác bỏ
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="p-10 text-center text-gray-500 italic"
                  >
                    Không có sự cố cần xử lý.
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

Pill.propTypes = {
  value: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(["status", "severity"]),
};

ClaimStatusPill.propTypes = {
  value: PropTypes.string.isRequired,
};

ClaimSlaPill.propTypes = {
  sla: PropTypes.shape({
    status: PropTypes.string,
  }),
};

ClaimRiskPill.propTypes = {
  risk: PropTypes.shape({
    level: PropTypes.string,
    score: PropTypes.number,
    indicators: PropTypes.array,
  }),
};

ProtectionSettlementPanel.propTypes = {
  settlement: PropTypes.shape({
    status: PropTypes.string,
    protectionPlan: PropTypes.string,
    eligibleDamageAmount: PropTypes.number,
    nonCoveredChargeAmount: PropTypes.number,
    deductibleAppliedAmount: PropTypes.number,
    platformCoverageAmount: PropTypes.number,
    renterLiabilityAmount: PropTypes.number,
    excessAboveCoverageAmount: PropTypes.number,
  }),
};

EvidenceLinks.propTypes = {
  report: PropTypes.shape({
    evidence: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    requiredEvidence: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }).isRequired,
};

export default IncidentReportsQueue;
