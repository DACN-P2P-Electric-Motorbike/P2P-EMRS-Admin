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

const formatId = (id) => (id ? `#${id.slice(0, 8)}` : "-");

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

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
  const [error, setError] = useState("");

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

  const totals = useMemo(() => {
    const critical = items.filter((item) => item.severity === "CRITICAL").length;
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
                        {item.status === "OPEN" && (
                          <button
                            disabled={busyId === item.id}
                            onClick={() =>
                              reviewIncident(item, "UNDER_REVIEW")
                            }
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

EvidenceLinks.propTypes = {
  report: PropTypes.shape({
    evidence: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    requiredEvidence: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }).isRequired,
};

export default IncidentReportsQueue;
