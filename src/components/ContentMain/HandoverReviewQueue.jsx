import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import adminService from "../../Service/adminService";

const statusClass = {
  CONFIRMED: "bg-blue-500/10 text-blue-300",
  ONGOING: "bg-yellow-500/10 text-yellow-300",
  COMPLETED: "bg-green-500/10 text-green-300",
  CANCELLED: "bg-gray-500/10 text-gray-300",
};

const handoverTypeLabel = {
  CHECK_IN: "Nhận xe",
  CHECK_OUT: "Trả xe",
};

const formatId = (id) => (id ? `#${id.slice(0, 8)}` : "-");

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "-";

const signedText = (value) => (value ? "Đã ký" : "Chưa ký");

const StatusPill = ({ value }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusClass[value] || "bg-white/10 text-white"}`}
  >
    {value}
  </span>
);

const EvidenceLinks = ({ photos }) => {
  if (!photos?.length) {
    return <span className="text-xs text-gray-500">Không có ảnh</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((photo, index) => (
        <a
          key={photo.id || photo.photoUrl}
          href={photo.photoUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-200 hover:border-pumpkin/70 hover:text-pumpkin"
        >
          {photo.photoType || `Ảnh ${index + 1}`}
        </a>
      ))}
    </div>
  );
};

const HandoverBlock = ({ handover }) => {
  if (!handover) {
    return <span className="text-sm text-gray-500">Chưa có dữ liệu</span>;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-pumpkin">
          {handoverTypeLabel[handover.type] || handover.type}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            handover.isComplete
              ? "bg-green-500/10 text-green-300"
              : "bg-yellow-500/10 text-yellow-300"
          }`}
        >
          {handover.isComplete ? "Đủ chữ ký" : "Thiếu chữ ký"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-300">
        <span>Odo: {handover.odometerReading ?? "-"} km</span>
        <span>Pin: {handover.batteryLevel ?? "-"}%</span>
        <span>Owner: {signedText(handover.confirmedByOwner)}</span>
        <span>Renter: {signedText(handover.confirmedByRenter)}</span>
      </div>
      {handover.notes && (
        <p className="mt-2 text-xs text-gray-400">{handover.notes}</p>
      )}
      <div className="mt-3">
        <EvidenceLinks photos={handover.photos} />
      </div>
    </div>
  );
};

const HandoverReviewQueue = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminService.getHandoverReviewQueue(100);
      setItems(result.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải hàng chờ bàn giao");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const totals = useMemo(() => {
    const missingSignature = items.filter((item) => {
      const { checkIn, checkOut } = item.handover || {};
      return (
        (checkIn && !checkIn.isComplete) || (checkOut && !checkOut.isComplete)
      );
    }).length;

    const completedPairs = items.filter(
      (item) => item.handover?.checkIn && item.handover?.checkOut,
    ).length;

    return {
      total: items.length,
      missingSignature,
      completedPairs,
    };
  }, [items]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-white">
        <div className="w-10 h-10 border-4 border-pumpkin/20 border-t-pumpkin rounded-full animate-spin mb-4"></div>
        <p>Đang tải hàng chờ bàn giao...</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-white min-h-screen">
      <div className="flex flex-wrap justify-between gap-4 items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-wider">
            Bằng chứng bàn giao
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Đối chiếu ảnh, chữ ký, odo và pin ở lượt nhận/trả xe.
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
            Booking có bàn giao
          </p>
          <p className="text-2xl font-bold mt-2">{totals.total}</p>
        </div>
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Thiếu chữ ký
          </p>
          <p className="text-2xl font-bold mt-2">{totals.missingSignature}</p>
        </div>
        <div className="bg-primary border border-white/5 rounded-xl p-5">
          <p className="text-gray-400 text-xs uppercase tracking-widest">
            Đủ nhận và trả
          </p>
          <p className="text-2xl font-bold mt-2">{totals.completedPairs}</p>
        </div>
      </div>

      <section className="bg-primary rounded-xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1180px]">
            <thead>
              <tr className="text-gray-400 border-b border-white/5 text-xs uppercase tracking-widest">
                <th className="p-5">Booking / Xe</th>
                <th className="p-5">Người dùng</th>
                <th className="p-5">Nhận xe</th>
                <th className="p-5">Trả xe</th>
                <th className="p-5">Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr
                    key={item.booking.id}
                    className="border-b border-white/5 hover:bg-white/5 align-top"
                  >
                    <td className="p-5">
                      <div className="flex gap-3">
                        {item.booking.vehicle?.images?.[0] && (
                          <img
                            src={item.booking.vehicle.images[0]}
                            alt="vehicle"
                            className="h-14 w-20 rounded-lg object-cover border border-white/10"
                          />
                        )}
                        <div>
                          <p className="font-semibold">
                            {formatId(item.booking.id)}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {item.booking.vehicle?.brand}{" "}
                            {item.booking.vehicle?.model}
                          </p>
                          <p className="mt-1 text-xs font-mono text-pumpkin">
                            {item.booking.vehicle?.licensePlate || "-"}
                          </p>
                          <div className="mt-2">
                            <StatusPill value={item.booking.status} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 text-xs text-gray-300">
                      <p className="font-semibold text-white">
                        Renter: {item.booking.renter?.fullName || "-"}
                      </p>
                      <p className="mt-1 text-gray-500">
                        {item.booking.renter?.email || "-"}
                      </p>
                      <p className="mt-3 font-semibold text-white">
                        Owner: {item.booking.owner?.fullName || "-"}
                      </p>
                      <p className="mt-1 text-gray-500">
                        {item.booking.owner?.email || "-"}
                      </p>
                      <p className="mt-3 text-gray-400">
                        {formatDateTime(item.booking.startTime)} -{" "}
                        {formatDateTime(item.booking.endTime)}
                      </p>
                    </td>
                    <td className="p-5">
                      <HandoverBlock handover={item.handover?.checkIn} />
                    </td>
                    <td className="p-5">
                      <HandoverBlock handover={item.handover?.checkOut} />
                    </td>
                    <td className="p-5 text-sm text-gray-300">
                      <p>
                        Quãng đường:{" "}
                        {item.handover?.differences?.kmDriven ?? "-"} km
                      </p>
                      <p className="mt-2">
                        Pin: {item.handover?.differences?.batteryDelta ?? "-"}%
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="p-10 text-center text-gray-500 italic"
                  >
                    Không có bằng chứng bàn giao cần xem.
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

EvidenceLinks.propTypes = {
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      photoUrl: PropTypes.string.isRequired,
      photoType: PropTypes.string,
    }),
  ),
};

HandoverBlock.propTypes = {
  handover: PropTypes.shape({
    type: PropTypes.string.isRequired,
    isComplete: PropTypes.bool.isRequired,
    odometerReading: PropTypes.number,
    batteryLevel: PropTypes.number,
    confirmedByOwner: PropTypes.bool.isRequired,
    confirmedByRenter: PropTypes.bool.isRequired,
    notes: PropTypes.string,
    photos: PropTypes.array,
  }),
};

export default HandoverReviewQueue;
